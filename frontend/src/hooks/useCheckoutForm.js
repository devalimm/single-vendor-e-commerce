import { useState, useCallback } from 'react';

const INITIAL_FORM_DATA = {
   fullName: '',
   tcKimlik: '',
   email: '',
   phone: '',
   city: '',
   district: '',
   neighborhood: '',
   address: '',
   customerNote: ''
};

const VALIDATORS = {
   1: (formData) => {
      const errors = {};
      if (!formData.fullName.trim()) errors.fullName = 'Ad Soyad gereklidir';
      if (formData.tcKimlik.trim() && !/^\d{11}$/.test(formData.tcKimlik)) {
         errors.tcKimlik = 'TC Kimlik numarası 11 haneli olmalıdır';
      }
      if (!formData.email.trim()) {
         errors.email = 'E-posta gereklidir';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
         errors.email = 'Geçerli bir e-posta adresi giriniz';
      }
      if (!formData.phone.trim()) {
         errors.phone = 'Telefon numarası gereklidir';
      }
      return errors;
   },
   2: (formData) => {
      const errors = {};
      if (!formData.city) errors.city = 'İl seçimi gereklidir';
      if (!formData.district) errors.district = 'İlçe seçimi gereklidir';
      if (!formData.neighborhood) errors.neighborhood = 'Mahalle gereklidir';
      if (!formData.address.trim()) errors.address = 'Açık adres gereklidir';
      return errors;
   }
};

export const useCheckoutForm = () => {
   const [formData, setFormData] = useState(INITIAL_FORM_DATA);
   const [errors, setErrors] = useState({});
   const [agreementAccepted, setAgreementAccepted] = useState(false);
   const [step, setStep] = useState(1);

   const updateField = useCallback((name, value) => {
      setFormData(prev => {
         const newData = { ...prev, [name]: value };
         if (name === 'city') {
            newData.district = '';
            newData.neighborhood = '';
         } else if (name === 'district') {
            newData.neighborhood = '';
         }
         return newData;
      });
      setErrors(prev => ({ ...prev, [name]: '' }));
   }, []);

   const validateStep = useCallback((stepNumber) => {
      const validator = VALIDATORS[stepNumber];
      if (!validator) return true;
      const newErrors = validator(formData);
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
   }, [formData]);

   const nextStep = useCallback(() => {
      if (validateStep(step)) {
         setStep(prev => prev + 1);
      }
   }, [step, validateStep]);

   const prevStep = useCallback(() => {
      setStep(prev => prev - 1);
   }, []);

   const resetForm = useCallback(() => {
      setFormData(INITIAL_FORM_DATA);
      setErrors({});
      setAgreementAccepted(false);
      setStep(1);
   }, []);

   return {
      formData,
      setFormData,
      errors,
      setErrors,
      agreementAccepted,
      setAgreementAccepted,
      step,
      setStep,
      updateField,
      validateStep,
      nextStep,
      prevStep,
      resetForm
   };
};