// Mock data for demo — inject before Supabase loads
window.__MOCK_ENABLED = true;

window.__MOCK_DATA = {
  profiles: [
    { id: 'demo-1', email: 'admin@demo.school', display_name: 'ผู้ดูแลระบบ', role: 'admin', approved: true, department: 'IT', position: 'Admin', created_at: '2025-01-01' }
  ],
  fiscal_years: [
    { id: 'fy-1', name: '2568', start_date: '2024-10-01', end_date: '2025-09-30', is_active: true },
    { id: 'fy-2', name: '2567', start_date: '2023-10-01', end_date: '2024-09-30', is_active: false },
  ],
  projects: [
    { id: 'proj-1', fiscal_year_id: 'fy-1', name: 'โครงการพัฒนาทักษะภาษาอังกฤษ', budget: 150000, work_group: 'academic', responsible_person: 'อ.สมศรี ใจดี', description: 'จัดอบรมภาษาอังกฤษสำหรับนักเรียน ม.1-ม.6', start_date: '2024-10-01', end_date: '2025-09-30', status: 'active', used_budget: 45000, created_by: 'demo-1', created_at: '2024-10-15', profiles: { display_name: 'ผู้ดูแลระบบ' }, fiscal_years: { id: 'fy-1', name: '2568' } },
    { id: 'proj-2', fiscal_year_id: 'fy-1', name: 'ปรับปรุงห้องปฏิบัติการคอมพิวเตอร์', budget: 500000, work_group: 'budget', responsible_person: 'อ.สมชาย รักเรียน', description: 'จัดซื้อคอมพิวเตอร์ใหม่ 40 เครื่อง', start_date: '2024-11-01', end_date: '2025-03-31', status: 'active', used_budget: 320000, created_by: 'demo-1', created_at: '2024-11-01', profiles: { display_name: 'ผู้ดูแลระบบ' }, fiscal_years: { id: 'fy-1', name: '2568' } },
    { id: 'proj-3', fiscal_year_id: 'fy-1', name: 'พัฒนาหลักสูตรท้องถิ่น', budget: 80000, work_group: 'general', responsible_person: 'อ.ประภาส รู้รอบ', description: 'พัฒนาหลักสูตรวิชาชีพท้องถิ่น', start_date: '2024-12-01', end_date: '2025-08-31', status: 'completed', used_budget: 78000, created_by: 'demo-1', created_at: '2024-12-01', profiles: { display_name: 'ผู้ดูแลระบบ' }, fiscal_years: { id: 'fy-1', name: '2568' } },
    { id: 'proj-4', fiscal_year_id: 'fy-2', name: 'โครงการอาหารกลางวัน (ปี 2567)', budget: 200000, work_group: 'hr', responsible_person: 'อ.วิภา แสนดี', description: 'โครงการอาหารกลางวันปีงบประมาณ 2567', start_date: '2023-10-01', end_date: '2024-09-30', status: 'completed', used_budget: 200000, created_by: 'demo-1', created_at: '2023-10-01', profiles: { display_name: 'ผู้ดูแลระบบ' }, fiscal_years: { id: 'fy-2', name: '2567' } },
    { id: 'proj-5', fiscal_year_id: 'fy-1', name: 'ซ่อมแซมอาคารเรียน', budget: 300000, work_group: 'other', responsible_person: 'อ.ธนา ช่างคิด', description: 'ซ่อมหลังคาและทาสีอาคารเรียน', start_date: '2025-01-01', end_date: '2025-06-30', status: 'suspended', used_budget: 0, created_by: 'demo-1', created_at: '2025-01-01', profiles: { display_name: 'ผู้ดูแลระบบ' }, fiscal_years: { id: 'fy-1', name: '2568' } },
  ],
  category_types: [
    { id: 'cat-1', category_key: 'ACTIVITY_FUNDS', category_name: 'เงินกิจกรรมพัฒนาผู้เรียน', description: 'เงินสำหรับกิจกรรมพัฒนาผู้เรียน', is_active: true },
    { id: 'cat-2', category_key: 'SUPPLIES_FUNDS', category_name: 'เงินค่าอุปกรณ์การเรียน', description: 'เงินสำหรับจัดซื้ออุปกรณ์การเรียนการสอน', is_active: true },
    { id: 'cat-3', category_key: 'UNIFORMS_FUNDS', category_name: 'เงินค่าเครื่องแบบนักเรียน', description: 'เงินสำหรับจัดซื้อเครื่องแบบนักเรียน', is_active: true },
    { id: 'cat-4', category_key: 'INCOME', category_name: 'เงินรายได้สถานศึกษา', description: 'เงินรายได้ของสถานศึกษา', is_active: true },
    { id: 'cat-5', category_key: 'LUNCH', category_name: 'เงินอาหารกลางวัน', description: 'เงินสำหรับอาหารกลางวันนักเรียน', is_active: true },
    { id: 'cat-6', category_key: 'SUBSIDY', category_name: 'เงินอุดหนุนรายหัว', description: 'เงินอุดหนุนรายหัวจากรัฐบาล', is_active: true },
  ],
  transactions: [
    { id: 'tx-1', project_id: 'proj-1', category_type_id: 'cat-1', amount: -15000, transaction_type: 'expense', description: 'ค่าอาหารว่างอบรม', transaction_date: '2024-11-15', projects: { id: 'proj-1', name: 'โครงการพัฒนาทักษะภาษาอังกฤษ' }, category_types: { category_name: 'เงินกิจกรรมพัฒนาผู้เรียน' } },
    { id: 'tx-2', project_id: 'proj-1', category_type_id: 'cat-2', amount: -30000, transaction_type: 'expense', description: 'ซื้อหนังสือแบบเรียน', transaction_date: '2024-11-20', projects: { id: 'proj-1', name: 'โครงการพัฒนาทักษะภาษาอังกฤษ' }, category_types: { category_name: 'เงินค่าอุปกรณ์การเรียน' } },
    { id: 'tx-3', project_id: 'proj-2', category_type_id: 'cat-2', amount: -320000, transaction_type: 'expense', description: 'จัดซื้อคอมพิวเตอร์ 40 เครื่อง', transaction_date: '2024-12-01', projects: { id: 'proj-2', name: 'ปรับปรุงห้องปฏิบัติการคอมพิวเตอร์' }, category_types: { category_name: 'เงินค่าอุปกรณ์การเรียน' } },
    { id: 'tx-4', project_id: 'proj-3', category_type_id: 'cat-1', amount: -78000, transaction_type: 'expense', description: 'จัดทำหลักสูตรท้องถิ่น', transaction_date: '2025-02-01', projects: { id: 'proj-3', name: 'พัฒนาหลักสูตรท้องถิ่น' }, category_types: { category_name: 'เงินกิจกรรมพัฒนาผู้เรียน' } },
    { id: 'tx-5', project_id: 'proj-1', category_type_id: 'cat-4', amount: 50000, transaction_type: 'income', description: 'เงินสนับสนุนจาก สพฐ.', transaction_date: '2024-10-15', projects: { id: 'proj-1', name: 'โครงการพัฒนาทักษะภาษาอังกฤษ' }, category_types: { category_name: 'เงินรายได้สถานศึกษา' } },
  ],
  budget_categories: [
    { id: 'bc-1', project_id: 'proj-1', category_type_id: 'cat-1', budget_amount: 50000, category_types: { category_key: 'ACTIVITY_FUNDS' } },
    { id: 'bc-2', project_id: 'proj-1', category_type_id: 'cat-2', budget_amount: 100000, category_types: { category_key: 'SUPPLIES_FUNDS' } },
    { id: 'bc-3', project_id: 'proj-2', category_type_id: 'cat-2', budget_amount: 500000, category_types: { category_key: 'SUPPLIES_FUNDS' } },
  ],
  system_settings: [
    { setting_key: 'site_name', setting_value: 'ระบบควบคุมงบประมาณ' },
    { setting_key: 'organization_name', setting_value: 'โรงเรียนสาธิตสามัคคีวิทยา' },
    { setting_key: 'site_title', setting_value: 'ระบบควบคุมงบประมาณ - โรงเรียนสาธิตสามัคคีวิทยา' },
    { setting_key: 'year_label_type', setting_value: 'fiscal_year' },
  ]
};
