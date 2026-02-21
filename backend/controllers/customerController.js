import User from '../models/User.js';

// @desc    Get all customers (paginated)
// @route   GET /api/customers?page=1&limit=20&search=
// @access  Admin
export const getCustomers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        // Build filter
        const filter = {};
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const [customers, total] = await Promise.all([
            User.find(filter)
                .select('-password -resetPasswordToken -resetPasswordExpire')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(filter)
        ]);

        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                customers,
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

// @desc    Get single customer details
// @route   GET /api/customers/:id
// @access  Admin
export const getCustomer = async (req, res) => {
    try {
        const customer = await User.findById(req.params.id)
            .select('-password -resetPasswordToken -resetPasswordExpire')
            .lean();

        if (!customer) {
            return res.status(404).json({ success: false, message: 'Müşteri bulunamadı.' });
        }

        res.json({ success: true, data: customer });
    } catch (error) {
        console.error('Get customer error:', error);
        res.status(500).json({ success: false, message: 'Müşteri bilgileri alınamadı.' });
    }
};
