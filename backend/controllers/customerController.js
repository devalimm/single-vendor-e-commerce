import User from '../models/User.js';
import Order from '../models/Order.js';

export const getCustomers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';

        const users = await User.find({ role: { $ne: 'admin' } })
            .select('-password -resetPasswordToken -resetPasswordExpire')
            .lean();

        const userOrderStats = await Order.aggregate([
            { $match: { user: { $ne: null } } },
            {
                $group: {
                    _id: '$user',
                    orderCount: { $sum: 1 },
                    totalSpent: { $sum: '$total' },
                    firstOrderDate: { $min: '$createdAt' },
                    lastOrderDate: { $max: '$createdAt' }
                }
            }
        ]);

        const guestCustomers = await Order.aggregate([
            { $match: { user: null } },
            {
                $group: {
                    _id: '$shippingAddress.phone',
                    name: { $first: '$shippingAddress.fullName' },
                    phone: { $first: '$shippingAddress.phone' },
                    email: { $first: '$shippingAddress.email' },
                    city: { $first: '$shippingAddress.city' },
                    district: { $first: '$shippingAddress.district' },
                    orderCount: { $sum: 1 },
                    totalSpent: { $sum: '$total' },
                    firstOrderDate: { $min: '$createdAt' },
                    lastOrderDate: { $max: '$createdAt' }
                }
            }
        ]);

        const userOrderMap = {};
        userOrderStats.forEach(stat => {
            userOrderMap[stat._id.toString()] = stat;
        });

        const registeredPhones = new Set(users.map(u => u.phone));
        const registeredEmails = new Set(users.map(u => u.email).filter(Boolean));

        const allCustomers = [];

        users.forEach(user => {
            const stats = userOrderMap[user._id.toString()] || {};
            allCustomers.push({
                _id: user._id.toString(),
                type: 'registered',
                name: user.name,
                phone: user.phone,
                email: user.email || '',
                role: user.role,
                city: user.address?.city || '',
                district: user.address?.state || '',
                address: user.address,
                createdAt: user.createdAt,
                orderCount: stats.orderCount || 0,
                totalSpent: stats.totalSpent || 0,
                firstOrderDate: stats.firstOrderDate || null,
                lastOrderDate: stats.lastOrderDate || null
            });
        });

        guestCustomers.forEach(guest => {
            if (registeredPhones.has(guest._id)) return;
            if (guest.email && registeredEmails.has(guest.email)) return;

            allCustomers.push({
                _id: `guest_${guest._id}`,
                type: 'guest',
                name: guest.name,
                phone: guest.phone,
                email: guest.email || '',
                role: 'guest',
                city: guest.city || '',
                district: guest.district || '',
                address: null,
                createdAt: guest.firstOrderDate,
                orderCount: guest.orderCount,
                totalSpent: guest.totalSpent,
                firstOrderDate: guest.firstOrderDate,
                lastOrderDate: guest.lastOrderDate
            });
        });

        let filtered = allCustomers;
        if (search) {
            const s = search.toLowerCase();
            filtered = allCustomers.filter(c =>
                (c.name && c.name.toLowerCase().includes(s)) ||
                (c.phone && c.phone.toLowerCase().includes(s)) ||
                (c.email && c.email.toLowerCase().includes(s)) ||
                (c.city && c.city.toLowerCase().includes(s)) ||
                (c.district && c.district.toLowerCase().includes(s))
            );
        }

        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const total = filtered.length;
        const totalPages = Math.ceil(total / limit);
        const skip = (page - 1) * limit;
        const paginatedCustomers = filtered.slice(skip, skip + limit);

        res.json({
            success: true,
            data: {
                customers: paginatedCustomers,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalCustomers: total,
                    limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error) {
        console.error('Get customers error:', error);
        res.status(500).json({ success: false, message: 'Müşteriler alınamadı.' });
    }
};

export const getCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        let customer = null;
        let orders = [];

        if (id.startsWith('guest_')) {
            const phone = id.replace('guest_', '');
            orders = await Order.find({
                'shippingAddress.phone': phone,
                user: null
            }).sort({ createdAt: -1 }).lean();

            if (orders.length === 0) {
                return res.status(404).json({ success: false, message: 'Müşteri bulunamadı.' });
            }

            const firstOrder = orders[0];
            const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

            customer = {
                _id: id,
                type: 'guest',
                name: firstOrder.shippingAddress.fullName,
                phone: firstOrder.shippingAddress.phone,
                email: firstOrder.shippingAddress.email || '',
                tcKimlik: firstOrder.shippingAddress.tcKimlik || '',
                role: 'guest',
                city: firstOrder.shippingAddress.city,
                district: firstOrder.shippingAddress.district,
                neighborhood: firstOrder.shippingAddress.neighborhood,
                address: firstOrder.shippingAddress.address,
                createdAt: orders[orders.length - 1].createdAt,
                orderCount: orders.length,
                totalSpent,
                firstOrderDate: orders[orders.length - 1].createdAt,
                lastOrderDate: orders[0].createdAt,
                orders
            };
        } else {
            const user = await User.findById(id)
                .select('-password -resetPasswordToken -resetPasswordExpire')
                .lean();

            if (!user) {
                return res.status(404).json({ success: false, message: 'Müşteri bulunamadı.' });
            }

            orders = await Order.find({ user: id })
                .sort({ createdAt: -1 })
                .lean();

            const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);

            customer = {
                ...user,
                _id: user._id.toString(),
                type: 'registered',
                orderCount: orders.length,
                totalSpent,
                firstOrderDate: orders.length > 0 ? orders[orders.length - 1].createdAt : null,
                lastOrderDate: orders.length > 0 ? orders[0].createdAt : null,
                orders
            };
        }

        res.json({ success: true, data: customer });
    } catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({ success: false, message: 'Müşteri bilgileri alınamadı.' });
    }
};