import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
    getContacts, createContact, updateContact, deleteContact,
    getCompanies, createCompany, updateCompany, deleteCompany,
    getTags, createTag, deleteTag,
    getCustomFields, createCustomField, updateCustomField, deleteCustomField,
} from '../controllers/crmController';

const router = Router();

router.use(authenticate);

// Contacts
router.get('/contacts', getContacts);
router.post('/contacts', createContact);
router.put('/contacts/:id', updateContact);
router.delete('/contacts/:id', deleteContact);

// Companies
router.get('/companies', getCompanies);
router.post('/companies', createCompany);
router.put('/companies/:id', updateCompany);
router.delete('/companies/:id', deleteCompany);

// Tags
router.get('/tags', getTags);
router.post('/tags', createTag);
router.delete('/tags/:id', deleteTag);

// Custom Fields
router.get('/custom-fields', getCustomFields);
router.post('/custom-fields', createCustomField);
router.put('/custom-fields/:id', updateCustomField);
router.delete('/custom-fields/:id', deleteCustomField);

export default router;
