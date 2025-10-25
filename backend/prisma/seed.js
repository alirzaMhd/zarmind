"use strict";
// backend/prisma/seed.ts
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    console.log('🌱 Starting seed...');
    // ============================================
    // 1. BRANCHES
    // ============================================
    console.log('📍 Creating branches...');
    const mainBranch = await prisma.branch.create({
        data: {
            name: 'Main Branch - Tehran',
            code: 'BR-001',
            address: '123 Valiasr Street, Tehran',
            city: 'Tehran',
            phone: '+98-21-12345678',
            email: 'main@zarmind.com',
            isActive: true,
            isMainBranch: true,
        },
    });
    const branch2 = await prisma.branch.create({
        data: {
            name: 'Isfahan Branch',
            code: 'BR-002',
            address: '456 Chahar Bagh Street, Isfahan',
            city: 'Isfahan',
            phone: '+98-31-87654321',
            email: 'isfahan@zarmind.com',
            isActive: true,
            isMainBranch: false,
        },
    });
    const branch3 = await prisma.branch.create({
        data: {
            name: 'Shiraz Branch',
            code: 'BR-003',
            address: '789 Zand Street, Shiraz',
            city: 'Shiraz',
            phone: '+98-71-11223344',
            email: 'shiraz@zarmind.com',
            isActive: true,
            isMainBranch: false,
        },
    });
    // ============================================
    // 2. EMPLOYEES
    // ============================================
    console.log('👥 Creating employees...');
    const employee1 = await prisma.employee.create({
        data: {
            employeeCode: 'EMP-001',
            firstName: 'Ali',
            lastName: 'Rezaei',
            phone: '+98-912-1234567',
            email: 'ali.rezaei@zarmind.com',
            nationalId: '0012345678',
            position: 'Store Manager',
            department: 'Sales',
            employmentType: client_1.EmploymentType.FULL_TIME,
            hireDate: new Date('2020-01-15'),
            status: client_1.EmploymentStatus.ACTIVE,
            branchId: mainBranch.id,
            baseSalary: 50000000,
            commissionRate: 2.5,
            address: 'Tehran, District 1',
            city: 'Tehran',
            birthDate: new Date('1985-03-20'),
        },
    });
    const employee2 = await prisma.employee.create({
        data: {
            employeeCode: 'EMP-002',
            firstName: 'Fatima',
            lastName: 'Hosseini',
            phone: '+98-912-2345678',
            email: 'fatima.hosseini@zarmind.com',
            nationalId: '0012345679',
            position: 'Sales Associate',
            department: 'Sales',
            employmentType: client_1.EmploymentType.FULL_TIME,
            hireDate: new Date('2021-06-01'),
            status: client_1.EmploymentStatus.ACTIVE,
            branchId: mainBranch.id,
            baseSalary: 35000000,
            commissionRate: 3.0,
            address: 'Tehran, District 2',
            city: 'Tehran',
            birthDate: new Date('1990-07-15'),
        },
    });
    const employee3 = await prisma.employee.create({
        data: {
            employeeCode: 'EMP-003',
            firstName: 'Mohammad',
            lastName: 'Karimi',
            phone: '+98-912-3456789',
            email: 'mohammad.karimi@zarmind.com',
            nationalId: '0012345680',
            position: 'Accountant',
            department: 'Finance',
            employmentType: client_1.EmploymentType.FULL_TIME,
            hireDate: new Date('2019-03-10'),
            status: client_1.EmploymentStatus.ACTIVE,
            branchId: mainBranch.id,
            baseSalary: 45000000,
            commissionRate: 0,
            address: 'Tehran, District 3',
            city: 'Tehran',
            birthDate: new Date('1988-11-25'),
        },
    });
    const employee4 = await prisma.employee.create({
        data: {
            employeeCode: 'EMP-004',
            firstName: 'Zahra',
            lastName: 'Ahmadi',
            phone: '+98-913-4567890',
            email: 'zahra.ahmadi@zarmind.com',
            nationalId: '0012345681',
            position: 'Sales Associate',
            department: 'Sales',
            employmentType: client_1.EmploymentType.FULL_TIME,
            hireDate: new Date('2022-01-15'),
            status: client_1.EmploymentStatus.ACTIVE,
            branchId: branch2.id,
            baseSalary: 33000000,
            commissionRate: 3.0,
            address: 'Isfahan, District 1',
            city: 'Isfahan',
            birthDate: new Date('1992-05-10'),
        },
    });
    // ============================================
    // 3. USERS
    // ============================================
    // ============================================
    // 3. USERS
    // ============================================
    console.log('🔐 Creating users...');
    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@zarmind.com',
            username: 'admin',
            password: '$2b$10$XQqZ8Z8Z8Z8Z8Z8Z8Z8Z8eK', // hashed: "Admin@123"
            firstName: 'System',
            lastName: 'Administrator',
            phone: '+98-912-0000000',
            role: client_1.UserRole.SUPER_ADMIN,
            status: 'ACTIVE',
            branchId: mainBranch.id,
            // Don't assign employeeId - system admin is not an employee
        },
    });
    const managerUser = await prisma.user.create({
        data: {
            email: 'manager@zarmind.com',
            username: 'manager',
            password: '$2b$10$XQqZ8Z8Z8Z8Z8Z8Z8Z8Z8eK',
            firstName: 'Ali',
            lastName: 'Rezaei',
            phone: '+98-912-1234567',
            role: client_1.UserRole.MANAGER,
            status: 'ACTIVE',
            branchId: mainBranch.id,
            employeeId: employee1.id, // Manager is employee1
        },
    });
    const salesUser1 = await prisma.user.create({
        data: {
            email: 'fatima@zarmind.com',
            username: 'fatima.h',
            password: '$2b$10$XQqZ8Z8Z8Z8Z8Z8Z8Z8Z8eK',
            firstName: 'Fatima',
            lastName: 'Hosseini',
            phone: '+98-912-2345678',
            role: client_1.UserRole.SALES_STAFF,
            status: 'ACTIVE',
            branchId: mainBranch.id,
            employeeId: employee2.id, // Sales staff 1 is employee2
        },
    });
    const accountantUser = await prisma.user.create({
        data: {
            email: 'accountant@zarmind.com',
            username: 'mohammad.k',
            password: '$2b$10$XQqZ8Z8Z8Z8Z8Z8Z8Z8Z8eK',
            firstName: 'Mohammad',
            lastName: 'Karimi',
            phone: '+98-912-3456789',
            role: client_1.UserRole.ACCOUNTANT,
            status: 'ACTIVE',
            branchId: mainBranch.id,
            employeeId: employee3.id, // Accountant is employee3
        },
    });
    const salesUser2 = await prisma.user.create({
        data: {
            email: 'zahra@zarmind.com',
            username: 'zahra.a',
            password: '$2b$10$XQqZ8Z8Z8Z8Z8Z8Z8Z8Z8eK',
            firstName: 'Zahra',
            lastName: 'Ahmadi',
            phone: '+98-913-4567890',
            role: client_1.UserRole.SALES_STAFF,
            status: 'ACTIVE',
            branchId: branch2.id,
            employeeId: employee4.id, // Sales staff 2 is employee4
        },
    });
    // ============================================
    // 4. CUSTOMERS
    // ============================================
    console.log('👤 Creating customers...');
    const customer1 = await prisma.customer.create({
        data: {
            code: 'CUST-001',
            type: client_1.CustomerType.INDIVIDUAL,
            status: client_1.CustomerStatus.ACTIVE,
            firstName: 'Reza',
            lastName: 'Mohammadi',
            phone: '+98-912-1111111',
            email: 'reza.m@email.com',
            nationalId: '0011111111',
            address: 'Tehran, Valiasr St.',
            city: 'Tehran',
            creditLimit: 100000000,
            currentBalance: 0,
            birthDate: new Date('1980-01-15'),
            loyaltyPoints: 150,
        },
    });
    const customer2 = await prisma.customer.create({
        data: {
            code: 'CUST-002',
            type: client_1.CustomerType.INDIVIDUAL,
            status: client_1.CustomerStatus.ACTIVE,
            firstName: 'Sara',
            lastName: 'Alavi',
            phone: '+98-912-2222222',
            email: 'sara.alavi@email.com',
            nationalId: '0011111112',
            address: 'Tehran, Enghelab St.',
            city: 'Tehran',
            creditLimit: 50000000,
            currentBalance: 0,
            birthDate: new Date('1995-05-20'),
            loyaltyPoints: 80,
        },
    });
    const customer3 = await prisma.customer.create({
        data: {
            code: 'CUST-003',
            type: client_1.CustomerType.BUSINESS,
            status: client_1.CustomerStatus.ACTIVE,
            businessName: 'Luxury Boutique Ltd',
            phone: '+98-21-88888888',
            email: 'info@luxuryboutique.com',
            nationalId: '1234567890',
            address: 'Tehran, Pasdaran Ave.',
            city: 'Tehran',
            creditLimit: 500000000,
            currentBalance: 0,
            loyaltyPoints: 500,
        },
    });
    const customer4 = await prisma.customer.create({
        data: {
            code: 'CUST-004',
            type: client_1.CustomerType.INDIVIDUAL,
            status: client_1.CustomerStatus.ACTIVE,
            firstName: 'Amir',
            lastName: 'Nazari',
            phone: '+98-913-3333333',
            email: 'amir.n@email.com',
            nationalId: '0011111113',
            address: 'Isfahan, Chahar Bagh',
            city: 'Isfahan',
            creditLimit: 75000000,
            currentBalance: 0,
            birthDate: new Date('1987-09-10'),
            loyaltyPoints: 200,
        },
    });
    // ============================================
    // 5. SUPPLIERS
    // ============================================
    console.log('🏭 Creating suppliers...');
    const supplier1 = await prisma.supplier.create({
        data: {
            code: 'SUPP-001',
            name: 'Tehran Gold Refinery',
            contactPerson: 'Mr. Ahmadi',
            phone: '+98-21-44444444',
            email: 'info@tehrангold.com',
            address: 'Tehran, Industrial Zone',
            city: 'Tehran',
            paymentTerms: 'NET 30',
            rating: 5,
            categories: ['RAW_GOLD', 'COIN'],
            licenseNumber: 'LIC-001-2020',
            taxId: 'TAX-001',
            status: client_1.SupplierStatus.ACTIVE,
        },
    });
    const supplier2 = await prisma.supplier.create({
        data: {
            code: 'SUPP-002',
            name: 'Diamond Import Co.',
            contactPerson: 'Mrs. Rostami',
            phone: '+98-21-55555555',
            email: 'sales@diamondimport.com',
            address: 'Tehran, Ferdowsi St.',
            city: 'Tehran',
            paymentTerms: 'NET 60',
            rating: 4,
            categories: ['STONE'],
            licenseNumber: 'LIC-002-2019',
            taxId: 'TAX-002',
            status: client_1.SupplierStatus.ACTIVE,
        },
    });
    const supplier3 = await prisma.supplier.create({
        data: {
            code: 'SUPP-003',
            name: 'Swiss Watch Distributor',
            contactPerson: 'Mr. Hashemi',
            phone: '+98-21-66666666',
            email: 'contact@swisswatch.ir',
            address: 'Tehran, Vanak Sq.',
            city: 'Tehran',
            paymentTerms: 'COD',
            rating: 5,
            categories: ['GENERAL_GOODS'],
            licenseNumber: 'LIC-003-2021',
            taxId: 'TAX-003',
            status: client_1.SupplierStatus.ACTIVE,
        },
    });
    // ============================================
    // 6. WORKSHOPS
    // ============================================
    console.log('🔨 Creating workshops...');
    const workshop1 = await prisma.workshop.create({
        data: {
            name: 'Master Goldsmith Workshop',
            code: 'WS-001',
            contactPerson: 'Ustad Hassan',
            phone: '+98-912-7777777',
            email: 'workshop@goldsmith.com',
            address: 'Tehran, Grand Bazaar',
            city: 'Tehran',
            status: client_1.WorkshopStatus.ACTIVE,
            specialization: ['GOLD_WORK', 'ENGRAVING'],
            rating: 5,
            paymentTerms: 'Per item completion',
        },
    });
    const workshop2 = await prisma.workshop.create({
        data: {
            name: 'Stone Setting Experts',
            code: 'WS-002',
            contactPerson: 'Mr. Rahimi',
            phone: '+98-912-8888888',
            email: 'info@stonesetting.com',
            address: 'Tehran, Jewelry District',
            city: 'Tehran',
            status: client_1.WorkshopStatus.ACTIVE,
            specialization: ['STONE_SETTING', 'REPAIR'],
            rating: 4,
            paymentTerms: 'Weekly',
        },
    });
    // ============================================
    // 7. GOLD PRICES
    // ============================================
    console.log('💰 Creating gold prices...');
    await prisma.goldPrice.createMany({
        data: [
            {
                purity: client_1.GoldPurity.K18,
                pricePerGram: 3500000,
                source: 'MANUAL',
                effectiveDate: new Date(),
            },
            {
                purity: client_1.GoldPurity.K21,
                pricePerGram: 4000000,
                source: 'MANUAL',
                effectiveDate: new Date(),
            },
            {
                purity: client_1.GoldPurity.K22,
                pricePerGram: 4200000,
                source: 'MANUAL',
                effectiveDate: new Date(),
            },
            {
                purity: client_1.GoldPurity.K24,
                pricePerGram: 4500000,
                source: 'MANUAL',
                effectiveDate: new Date(),
            },
        ],
    });
    // ============================================
    // 8. EXCHANGE RATES
    // ============================================
    console.log('💱 Creating exchange rates...');
    await prisma.exchangeRate.createMany({
        data: [
            {
                fromCurrency: 'USD',
                toCurrency: 'IRR',
                rate: 500000,
                source: 'MANUAL',
                effectiveDate: new Date(),
            },
            {
                fromCurrency: 'EUR',
                toCurrency: 'IRR',
                rate: 550000,
                source: 'MANUAL',
                effectiveDate: new Date(),
            },
            {
                fromCurrency: 'AED',
                toCurrency: 'IRR',
                rate: 136000,
                source: 'MANUAL',
                effectiveDate: new Date(),
            },
        ],
    });
    // ============================================
    // 9. PRODUCTS
    // ============================================
    console.log('💎 Creating products...');
    // Raw Gold Products
    const rawGold1 = await prisma.product.create({
        data: {
            sku: 'RG-24K-001',
            qrCode: 'QR-RG-24K-001',
            name: 'Raw Gold 24K Bar',
            description: '24 Karat pure gold bar',
            category: client_1.ProductCategory.RAW_GOLD,
            status: client_1.ProductStatus.IN_STOCK,
            weight: 100,
            purchasePrice: 450000000,
            sellingPrice: 460000000,
            goldPurity: client_1.GoldPurity.K24,
            images: ['https://example.com/gold-bar-24k.jpg'],
        },
    });
    const rawGold2 = await prisma.product.create({
        data: {
            sku: 'RG-18K-001',
            qrCode: 'QR-RG-18K-001',
            name: 'Raw Gold 18K',
            description: '18 Karat gold material',
            category: client_1.ProductCategory.RAW_GOLD,
            status: client_1.ProductStatus.IN_STOCK,
            weight: 250,
            purchasePrice: 875000000,
            sellingPrice: 890000000,
            goldPurity: client_1.GoldPurity.K18,
        },
    });
    // Manufactured Products
    const product1 = await prisma.product.create({
        data: {
            sku: 'RING-001',
            qrCode: 'QR-RING-001',
            name: 'Diamond Engagement Ring',
            description: '18K gold ring with 1ct diamond',
            category: client_1.ProductCategory.MANUFACTURED_PRODUCT,
            status: client_1.ProductStatus.IN_STOCK,
            weight: 5.5,
            purchasePrice: 150000000,
            sellingPrice: 200000000,
            goldPurity: client_1.GoldPurity.K18,
            craftsmanshipFee: 25000000,
            images: ['https://example.com/ring1.jpg', 'https://example.com/ring1-detail.jpg'],
        },
    });
    const product2 = await prisma.product.create({
        data: {
            sku: 'NECK-001',
            qrCode: 'QR-NECK-001',
            name: 'Gold Necklace',
            description: 'Elegant 21K gold necklace',
            category: client_1.ProductCategory.MANUFACTURED_PRODUCT,
            status: client_1.ProductStatus.IN_STOCK,
            weight: 15.3,
            purchasePrice: 80000000,
            sellingPrice: 110000000,
            goldPurity: client_1.GoldPurity.K21,
            craftsmanshipFee: 15000000,
            images: ['https://example.com/necklace1.jpg'],
        },
    });
    const product3 = await prisma.product.create({
        data: {
            sku: 'BRAC-001',
            qrCode: 'QR-BRAC-001',
            name: 'Gold Bracelet',
            description: 'Classic 18K gold bracelet',
            category: client_1.ProductCategory.MANUFACTURED_PRODUCT,
            status: client_1.ProductStatus.IN_STOCK,
            weight: 12.0,
            purchasePrice: 55000000,
            sellingPrice: 75000000,
            goldPurity: client_1.GoldPurity.K18,
            craftsmanshipFee: 8000000,
            workshopId: workshop1.id,
            productionStatus: 'COMPLETED',
        },
    });
    // Product Stones (embedded in Ring)
    await prisma.productStone.createMany({
        data: [
            {
                productId: product1.id,
                stoneType: client_1.StoneType.DIAMOND,
                caratWeight: 1.0,
                quantity: 1,
                price: 50000000,
                notes: 'Center stone - VVS1 clarity',
            },
            {
                productId: product1.id,
                stoneType: client_1.StoneType.DIAMOND,
                caratWeight: 0.05,
                quantity: 12,
                price: 15000000,
                notes: 'Side stones - VS clarity',
            },
        ],
    });
    // Stones
    const stone1 = await prisma.product.create({
        data: {
            sku: 'STONE-DIA-001',
            qrCode: 'QR-STONE-DIA-001',
            name: '2ct Diamond',
            description: 'Round brilliant cut diamond',
            category: client_1.ProductCategory.STONE,
            status: client_1.ProductStatus.IN_STOCK,
            stoneType: client_1.StoneType.DIAMOND,
            caratWeight: 2.0,
            stoneQuality: 'VVS1',
            certificateNumber: 'GIA-123456789',
            purchasePrice: 120000000,
            sellingPrice: 160000000,
            quantity: 1,
        },
    });
    const stone2 = await prisma.product.create({
        data: {
            sku: 'STONE-RUBY-001',
            qrCode: 'QR-STONE-RUBY-001',
            name: '1.5ct Ruby',
            description: 'Pigeon blood red ruby',
            category: client_1.ProductCategory.STONE,
            status: client_1.ProductStatus.IN_STOCK,
            stoneType: client_1.StoneType.RUBY,
            caratWeight: 1.5,
            stoneQuality: 'AAA',
            certificateNumber: 'RUBY-987654321',
            purchasePrice: 80000000,
            sellingPrice: 110000000,
            quantity: 1,
        },
    });
    const stone3 = await prisma.product.create({
        data: {
            sku: 'STONE-EME-001',
            qrCode: 'QR-STONE-EME-001',
            name: '1ct Emerald',
            description: 'Colombian emerald',
            category: client_1.ProductCategory.STONE,
            status: client_1.ProductStatus.IN_STOCK,
            stoneType: client_1.StoneType.EMERALD,
            caratWeight: 1.0,
            stoneQuality: 'AA',
            purchasePrice: 50000000,
            sellingPrice: 70000000,
            quantity: 3,
        },
    });
    // Coins
    const coin1 = await prisma.product.create({
        data: {
            sku: 'COIN-BA-001',
            qrCode: 'QR-COIN-BA-001',
            name: 'Bahar Azadi Gold Coin',
            description: 'Full Bahar Azadi coin 2024',
            category: client_1.ProductCategory.COIN,
            status: client_1.ProductStatus.IN_STOCK,
            coinType: client_1.CoinType.BAHAR_AZADI,
            coinYear: 2024,
            weight: 8.133,
            purchasePrice: 45000000,
            sellingPrice: 47000000,
            quantity: 20,
        },
    });
    const coin2 = await prisma.product.create({
        data: {
            sku: 'COIN-NIM-001',
            qrCode: 'QR-COIN-NIM-001',
            name: 'Nim Bahar Azadi',
            description: 'Half Bahar Azadi coin 2024',
            category: client_1.ProductCategory.COIN,
            status: client_1.ProductStatus.IN_STOCK,
            coinType: client_1.CoinType.NIM_AZADI,
            coinYear: 2024,
            weight: 4.066,
            purchasePrice: 23000000,
            sellingPrice: 24000000,
            quantity: 35,
        },
    });
    const coin3 = await prisma.product.create({
        data: {
            sku: 'COIN-GER-001',
            qrCode: 'QR-COIN-GER-001',
            name: 'Gerami Gold Coin',
            description: 'Gerami coin 1 gram',
            category: client_1.ProductCategory.COIN,
            status: client_1.ProductStatus.IN_STOCK,
            coinType: client_1.CoinType.GERAMI,
            coinYear: 2024,
            weight: 1.0,
            purchasePrice: 5500000,
            sellingPrice: 5800000,
            quantity: 50,
        },
    });
    // Currency
    const currency1 = await prisma.product.create({
        data: {
            sku: 'CURR-USD-001',
            qrCode: 'QR-CURR-USD-001',
            name: 'US Dollar',
            description: 'United States Dollar',
            category: client_1.ProductCategory.CURRENCY,
            status: client_1.ProductStatus.IN_STOCK,
            currencyCode: 'USD',
            purchasePrice: 495000,
            sellingPrice: 505000,
            quantity: 10000,
        },
    });
    const currency2 = await prisma.product.create({
        data: {
            sku: 'CURR-EUR-001',
            qrCode: 'QR-CURR-EUR-001',
            name: 'Euro',
            description: 'European Euro',
            category: client_1.ProductCategory.CURRENCY,
            status: client_1.ProductStatus.IN_STOCK,
            currencyCode: 'EUR',
            purchasePrice: 545000,
            sellingPrice: 555000,
            quantity: 5000,
        },
    });
    // General Goods
    const goods1 = await prisma.product.create({
        data: {
            sku: 'WATCH-001',
            qrCode: 'QR-WATCH-001',
            name: 'Luxury Swiss Watch',
            description: 'Automatic luxury watch',
            category: client_1.ProductCategory.GENERAL_GOODS,
            status: client_1.ProductStatus.IN_STOCK,
            brand: 'Swiss Brand',
            model: 'Model XYZ',
            purchasePrice: 250000000,
            sellingPrice: 350000000,
            quantity: 5,
            images: ['https://example.com/watch1.jpg'],
        },
    });
    const goods2 = await prisma.product.create({
        data: {
            sku: 'ACC-001',
            qrCode: 'QR-ACC-001',
            name: 'Jewelry Box Premium',
            description: 'Luxury velvet jewelry box',
            category: client_1.ProductCategory.GENERAL_GOODS,
            status: client_1.ProductStatus.IN_STOCK,
            brand: 'LuxBox',
            purchasePrice: 2000000,
            sellingPrice: 3500000,
            quantity: 100,
        },
    });
    // ============================================
    // 10. INVENTORY
    // ============================================
    console.log('📦 Creating inventory...');
    await prisma.inventory.createMany({
        data: [
            // Main Branch
            { productId: rawGold1.id, branchId: mainBranch.id, quantity: 10, minimumStock: 5 },
            { productId: rawGold2.id, branchId: mainBranch.id, quantity: 15, minimumStock: 5 },
            { productId: product1.id, branchId: mainBranch.id, quantity: 3, minimumStock: 1, location: 'Shelf A-1' },
            { productId: product2.id, branchId: mainBranch.id, quantity: 5, minimumStock: 2, location: 'Shelf A-2' },
            { productId: product3.id, branchId: mainBranch.id, quantity: 4, minimumStock: 2, location: 'Shelf A-3' },
            { productId: stone1.id, branchId: mainBranch.id, quantity: 1, minimumStock: 0, location: 'Safe-1' },
            { productId: stone2.id, branchId: mainBranch.id, quantity: 1, minimumStock: 0, location: 'Safe-1' },
            { productId: stone3.id, branchId: mainBranch.id, quantity: 3, minimumStock: 1, location: 'Safe-2' },
            { productId: coin1.id, branchId: mainBranch.id, quantity: 20, minimumStock: 10, location: 'Vault-1' },
            { productId: coin2.id, branchId: mainBranch.id, quantity: 35, minimumStock: 15, location: 'Vault-1' },
            { productId: coin3.id, branchId: mainBranch.id, quantity: 50, minimumStock: 20, location: 'Vault-2' },
            { productId: currency1.id, branchId: mainBranch.id, quantity: 10000, minimumStock: 5000 },
            { productId: currency2.id, branchId: mainBranch.id, quantity: 5000, minimumStock: 2000 },
            { productId: goods1.id, branchId: mainBranch.id, quantity: 5, minimumStock: 2, location: 'Display-1' },
            { productId: goods2.id, branchId: mainBranch.id, quantity: 100, minimumStock: 20, location: 'Storage-1' },
            // Branch 2
            { productId: product2.id, branchId: branch2.id, quantity: 2, minimumStock: 1, location: 'Shelf B-1' },
            { productId: coin1.id, branchId: branch2.id, quantity: 15, minimumStock: 5, location: 'Vault-B1' },
            { productId: coin2.id, branchId: branch2.id, quantity: 20, minimumStock: 10, location: 'Vault-B1' },
            { productId: goods1.id, branchId: branch2.id, quantity: 3, minimumStock: 1, location: 'Display-B1' },
            // Branch 3
            { productId: product3.id, branchId: branch3.id, quantity: 3, minimumStock: 1, location: 'Shelf C-1' },
            { productId: coin1.id, branchId: branch3.id, quantity: 10, minimumStock: 5, location: 'Vault-C1' },
        ],
    });
    // ============================================
    // 11. BANK ACCOUNTS
    // ============================================
    console.log('🏦 Creating bank accounts...');
    const bankAccount1 = await prisma.bankAccount.create({
        data: {
            accountName: 'Zarmind Main Account',
            accountNumber: '1234567890',
            bankName: 'Mellat Bank',
            branchName: 'Valiasr Branch',
            iban: 'IR123456789012345678901234',
            balance: 5000000000,
            branchId: mainBranch.id,
            accountType: 'CHECKING',
            isActive: true,
        },
    });
    const bankAccount2 = await prisma.bankAccount.create({
        data: {
            accountName: 'Zarmind Savings',
            accountNumber: '0987654321',
            bankName: 'Melli Bank',
            branchName: 'Azadi Branch',
            iban: 'IR098765432109876543210987',
            balance: 3000000000,
            branchId: mainBranch.id,
            accountType: 'SAVINGS',
            isActive: true,
        },
    });
    const bankAccount3 = await prisma.bankAccount.create({
        data: {
            accountName: 'Isfahan Branch Account',
            accountNumber: '1122334455',
            bankName: 'Saderat Bank',
            branchName: 'Isfahan Main',
            iban: 'IR112233445511223344551122',
            balance: 1500000000,
            branchId: branch2.id,
            accountType: 'CHECKING',
            isActive: true,
        },
    });
    // ============================================
    // 12. BANK TRANSACTIONS
    // ============================================
    console.log('💳 Creating bank transactions...');
    await prisma.bankTransaction.createMany({
        data: [
            {
                bankAccountId: bankAccount1.id,
                type: client_1.BankTransactionType.DEPOSIT,
                amount: 100000000,
                transactionDate: new Date('2024-01-15'),
                description: 'Initial deposit',
                balanceAfter: 5100000000,
                reconciled: true,
            },
            {
                bankAccountId: bankAccount1.id,
                type: client_1.BankTransactionType.WITHDRAWAL,
                amount: 50000000,
                transactionDate: new Date('2024-01-20'),
                description: 'Supplier payment',
                balanceAfter: 5050000000,
                reconciled: true,
            },
            {
                bankAccountId: bankAccount2.id,
                type: client_1.BankTransactionType.DEPOSIT,
                amount: 200000000,
                transactionDate: new Date('2024-01-10'),
                description: 'Transfer from main account',
                balanceAfter: 3200000000,
                reconciled: true,
            },
        ],
    });
    // ============================================
    // 13. PURCHASES
    // ============================================
    console.log('🛒 Creating purchases...');
    const purchase1 = await prisma.purchase.create({
        data: {
            purchaseNumber: 'PUR-2024-001',
            purchaseDate: new Date('2024-01-10'),
            status: client_1.PurchaseStatus.COMPLETED,
            supplierId: supplier1.id,
            userId: managerUser.id,
            branchId: mainBranch.id,
            subtotal: 450000000,
            taxAmount: 40500000,
            totalAmount: 490500000,
            paidAmount: 490500000,
            paymentMethod: client_1.PaymentMethod.BANK_TRANSFER,
            deliveryDate: new Date('2024-01-10'),
            notes: 'Gold bar purchase',
        },
    });
    await prisma.purchaseItem.create({
        data: {
            purchaseId: purchase1.id,
            productId: rawGold1.id,
            quantity: 1,
            weight: 100,
            unitPrice: 450000000,
            subtotal: 450000000,
            receivedQuantity: 1,
        },
    });
    const purchase2 = await prisma.purchase.create({
        data: {
            purchaseNumber: 'PUR-2024-002',
            purchaseDate: new Date('2024-01-15'),
            status: client_1.PurchaseStatus.COMPLETED,
            supplierId: supplier2.id,
            userId: managerUser.id,
            branchId: mainBranch.id,
            subtotal: 200000000,
            taxAmount: 18000000,
            totalAmount: 218000000,
            paidAmount: 218000000,
            paymentMethod: client_1.PaymentMethod.CHECK,
            deliveryDate: new Date('2024-01-15'),
            notes: 'Diamond stones purchase',
        },
    });
    await prisma.purchaseItem.create({
        data: {
            purchaseId: purchase2.id,
            productId: stone1.id,
            quantity: 1,
            unitPrice: 120000000,
            subtotal: 120000000,
            receivedQuantity: 1,
        },
    });
    await prisma.purchaseItem.create({
        data: {
            purchaseId: purchase2.id,
            productId: stone2.id,
            quantity: 1,
            unitPrice: 80000000,
            subtotal: 80000000,
            receivedQuantity: 1,
        },
    });
    // ============================================
    // 14. SALES
    // ============================================
    console.log('💰 Creating sales...');
    const sale1 = await prisma.sale.create({
        data: {
            invoiceNumber: 'INV-2024-001',
            saleDate: new Date('2024-01-20'),
            status: client_1.SaleStatus.COMPLETED,
            customerId: customer1.id,
            userId: salesUser1.id,
            branchId: mainBranch.id,
            subtotal: 200000000,
            taxAmount: 18000000,
            discountAmount: 5000000,
            totalAmount: 213000000,
            paidAmount: 213000000,
            paymentMethod: client_1.PaymentMethod.CASH,
            notes: 'Customer very satisfied',
        },
    });
    await prisma.saleItem.create({
        data: {
            saleId: sale1.id,
            productId: product1.id,
            quantity: 1,
            weight: 5.5,
            unitPrice: 200000000,
            goldPrice: 19250000, // 5.5g * 3,500,000 (18K)
            stonePrice: 65000000,
            craftsmanshipFee: 25000000,
            discount: 5000000,
            subtotal: 200000000,
        },
    });
    const sale2 = await prisma.sale.create({
        data: {
            invoiceNumber: 'INV-2024-002',
            saleDate: new Date('2024-01-22'),
            status: client_1.SaleStatus.COMPLETED,
            customerId: customer2.id,
            userId: salesUser1.id,
            branchId: mainBranch.id,
            subtotal: 157000000,
            taxAmount: 14130000,
            discountAmount: 0,
            totalAmount: 171130000,
            paidAmount: 100000000,
            paymentMethod: client_1.PaymentMethod.MIXED,
            notes: 'Partial payment, rest on installment',
        },
    });
    await prisma.saleItem.createMany({
        data: [
            {
                saleId: sale2.id,
                productId: coin1.id,
                quantity: 2,
                weight: 16.266,
                unitPrice: 47000000,
                subtotal: 94000000,
            },
            {
                saleId: sale2.id,
                productId: coin2.id,
                quantity: 3,
                weight: 12.198,
                unitPrice: 24000000,
                subtotal: 72000000,
            },
        ],
    });
    const sale3 = await prisma.sale.create({
        data: {
            invoiceNumber: 'INV-2024-003',
            saleDate: new Date('2024-01-25'),
            status: client_1.SaleStatus.COMPLETED,
            customerId: customer3.id,
            userId: salesUser2.id,
            branchId: branch2.id,
            subtotal: 110000000,
            taxAmount: 9900000,
            discountAmount: 10000000,
            totalAmount: 109900000,
            paidAmount: 109900000,
            paymentMethod: client_1.PaymentMethod.BANK_TRANSFER,
            notes: 'Business customer - bulk discount applied',
        },
    });
    await prisma.saleItem.create({
        data: {
            saleId: sale3.id,
            productId: product2.id,
            quantity: 1,
            weight: 15.3,
            unitPrice: 110000000,
            goldPrice: 61200000, // 15.3g * 4,000,000 (21K)
            craftsmanshipFee: 15000000,
            discount: 10000000,
            subtotal: 110000000,
        },
    });
    // Sale Payments
    await prisma.salePayment.createMany({
        data: [
            {
                saleId: sale1.id,
                amount: 213000000,
                paymentMethod: client_1.PaymentMethod.CASH,
                paymentDate: new Date('2024-01-20'),
            },
            {
                saleId: sale2.id,
                amount: 100000000,
                paymentMethod: client_1.PaymentMethod.CASH,
                paymentDate: new Date('2024-01-22'),
            },
            {
                saleId: sale3.id,
                amount: 109900000,
                paymentMethod: client_1.PaymentMethod.BANK_TRANSFER,
                bankAccountId: bankAccount3.id,
                referenceNumber: 'TRX-123456',
                paymentDate: new Date('2024-01-25'),
            },
        ],
    });
    // ============================================
    // 15. ACCOUNTS RECEIVABLE
    // ============================================
    console.log('📊 Creating accounts receivable...');
    const receivable1 = await prisma.accountsReceivable.create({
        data: {
            customerId: customer2.id,
            invoiceNumber: 'INV-2024-002-AR',
            invoiceDate: new Date('2024-01-22'),
            amount: 71130000,
            paidAmount: 0,
            remainingAmount: 71130000,
            dueDate: new Date('2024-03-22'),
            status: 'PENDING',
            notes: 'Installment plan - 3 months',
        },
    });
    // Installments for the receivable
    await prisma.installment.createMany({
        data: [
            {
                receivableId: receivable1.id,
                installmentNumber: 1,
                amount: 23710000,
                dueDate: new Date('2024-02-22'),
                status: 'PENDING',
            },
            {
                receivableId: receivable1.id,
                installmentNumber: 2,
                amount: 23710000,
                dueDate: new Date('2024-03-22'),
                status: 'PENDING',
            },
            {
                receivableId: receivable1.id,
                installmentNumber: 3,
                amount: 23710000,
                dueDate: new Date('2024-04-22'),
                status: 'PENDING',
            },
        ],
    });
    // ============================================
    // 16. ACCOUNTS PAYABLE
    // ============================================
    console.log('📉 Creating accounts payable...');
    await prisma.accountsPayable.create({
        data: {
            supplierId: supplier3.id,
            invoiceNumber: 'SUPP-INV-001',
            invoiceDate: new Date('2024-01-15'),
            amount: 250000000,
            paidAmount: 0,
            remainingAmount: 250000000,
            dueDate: new Date('2024-02-15'),
            status: 'PENDING',
            notes: 'Payment for luxury watches',
        },
    });
    // ============================================
    // 17. CHECKS
    // ============================================
    console.log('💵 Creating checks...');
    const check1 = await prisma.check.create({
        data: {
            checkNumber: 'CHK-001-2024',
            type: client_1.CheckType.RECEIVABLE,
            status: client_1.CheckStatus.PENDING,
            amount: 50000000,
            issueDate: new Date('2024-01-25'),
            dueDate: new Date('2024-02-25'),
            bankName: 'Mellat Bank',
            branchName: 'Valiasr',
            accountNumber: '9876543210',
            issuerName: 'Reza Mohammadi',
            customerId: customer1.id,
            checkImages: ['https://example.com/check1-front.jpg', 'https://example.com/check1-back.jpg'],
            notes: 'Post-dated check from customer',
        },
    });
    const check2 = await prisma.check.create({
        data: {
            checkNumber: 'CHK-002-2024',
            type: client_1.CheckType.PAYABLE,
            status: client_1.CheckStatus.PENDING,
            amount: 218000000,
            issueDate: new Date('2024-01-15'),
            dueDate: new Date('2024-02-15'),
            bankName: 'Melli Bank',
            branchName: 'Azadi',
            accountNumber: '1234567890',
            payeeName: 'Diamond Import Co.',
            supplierId: supplier2.id,
            notes: 'Payment for diamond purchase',
        },
    });
    const check3 = await prisma.check.create({
        data: {
            checkNumber: 'CHK-003-2024',
            type: client_1.CheckType.RECEIVABLE,
            status: client_1.CheckStatus.CLEARED,
            amount: 30000000,
            issueDate: new Date('2024-01-10'),
            dueDate: new Date('2024-01-20'),
            bankName: 'Saderat Bank',
            accountNumber: '5555555555',
            issuerName: 'Sara Alavi',
            customerId: customer2.id,
            depositedDate: new Date('2024-01-20'),
            clearedDate: new Date('2024-01-22'),
        },
    });
    // ============================================
    // 18. CASH TRANSACTIONS
    // ============================================
    console.log('💵 Creating cash transactions...');
    await prisma.cashTransaction.createMany({
        data: [
            {
                type: client_1.CashTransactionType.OPENING_BALANCE,
                amount: 50000000,
                transactionDate: new Date('2024-01-20'),
                branchId: mainBranch.id,
                userId: salesUser1.id,
                description: 'Morning opening balance',
            },
            {
                type: client_1.CashTransactionType.CASH_IN,
                amount: 213000000,
                transactionDate: new Date('2024-01-20'),
                branchId: mainBranch.id,
                userId: salesUser1.id,
                category: 'SALE',
                referenceType: 'Sale',
                referenceId: sale1.id,
                description: 'Cash sale payment',
                receiptNumber: 'RCP-001',
            },
            {
                type: client_1.CashTransactionType.CASH_OUT,
                amount: 5000000,
                transactionDate: new Date('2024-01-20'),
                branchId: mainBranch.id,
                userId: salesUser1.id,
                category: 'EXPENSE',
                description: 'Office supplies purchase',
                receiptNumber: 'RCP-002',
            },
            {
                type: client_1.CashTransactionType.CLOSING_BALANCE,
                amount: 258000000,
                transactionDate: new Date('2024-01-20'),
                branchId: mainBranch.id,
                userId: salesUser1.id,
                description: 'Evening closing balance',
            },
        ],
    });
    // ============================================
    // 19. EXPENSE CATEGORIES
    // ============================================
    console.log('📝 Creating expense categories...');
    const expCatRent = await prisma.expenseCategory.create({
        data: {
            name: 'اجاره',
            nameEn: 'Rent',
            description: 'Monthly rent payments',
            isActive: true,
        },
    });
    const expCatSalary = await prisma.expenseCategory.create({
        data: {
            name: 'حقوق و دستمزد',
            nameEn: 'Salaries',
            description: 'Employee salaries and wages',
            isActive: true,
        },
    });
    const expCatUtilities = await prisma.expenseCategory.create({
        data: {
            name: 'آب و برق و گاز',
            nameEn: 'Utilities',
            description: 'Electricity, water, gas',
            isActive: true,
        },
    });
    const expCatMarketing = await prisma.expenseCategory.create({
        data: {
            name: 'تبلیغات',
            nameEn: 'Marketing',
            description: 'Advertising and marketing expenses',
            isActive: true,
        },
    });
    const expCatMaintenance = await prisma.expenseCategory.create({
        data: {
            name: 'تعمیر و نگهداری',
            nameEn: 'Maintenance',
            description: 'Repair and maintenance',
            isActive: true,
        },
    });
    const expCatOffice = await prisma.expenseCategory.create({
        data: {
            name: 'لوازم اداری',
            nameEn: 'Office Supplies',
            description: 'Office supplies and stationery',
            isActive: true,
        },
    });
    // ============================================
    // 20. EXPENSES
    // ============================================
    console.log('💸 Creating expenses...');
    await prisma.expense.createMany({
        data: [
            {
                categoryId: expCatRent.id,
                amount: 30000000,
                expenseDate: new Date('2024-01-01'),
                title: 'January Rent - Main Branch',
                description: 'Monthly rent for main branch location',
                vendor: 'Property Owner',
                paymentMethod: client_1.PaymentMethod.BANK_TRANSFER,
                approvedBy: managerUser.id,
                approvedAt: new Date('2024-01-01'),
            },
            {
                categoryId: expCatUtilities.id,
                amount: 5000000,
                expenseDate: new Date('2024-01-15'),
                title: 'Electricity Bill - January',
                description: 'Monthly electricity bill',
                vendor: 'Tehran Electricity',
                invoiceNumber: 'ELEC-JAN-2024',
                paymentMethod: client_1.PaymentMethod.CASH,
                approvedBy: accountantUser.id,
                approvedAt: new Date('2024-01-15'),
            },
            {
                categoryId: expCatMarketing.id,
                amount: 15000000,
                expenseDate: new Date('2024-01-10'),
                title: 'Instagram Advertising Campaign',
                description: 'Social media advertising for new collection',
                vendor: 'Digital Marketing Agency',
                paymentMethod: client_1.PaymentMethod.BANK_TRANSFER,
                approvedBy: managerUser.id,
                approvedAt: new Date('2024-01-10'),
            },
            {
                categoryId: expCatOffice.id,
                amount: 2000000,
                expenseDate: new Date('2024-01-12'),
                title: 'Office Supplies',
                description: 'Paper, pens, folders',
                vendor: 'Office Mart',
                invoiceNumber: 'OFF-123',
                paymentMethod: client_1.PaymentMethod.CASH,
            },
            {
                categoryId: expCatMaintenance.id,
                amount: 8000000,
                expenseDate: new Date('2024-01-18'),
                title: 'AC Repair',
                description: 'Air conditioning maintenance and repair',
                vendor: 'Cool Tech Services',
                invoiceNumber: 'CT-456',
                paymentMethod: client_1.PaymentMethod.CASH,
                approvedBy: managerUser.id,
                approvedAt: new Date('2024-01-18'),
            },
        ],
    });
    // ============================================
    // 21. WORK ORDERS
    // ============================================
    console.log('🔨 Creating work orders...');
    const workOrder1 = await prisma.workOrder.create({
        data: {
            orderNumber: 'WO-2024-001',
            workshopId: workshop1.id,
            productName: 'Custom Wedding Ring Set',
            description: 'Two matching 18K gold rings with diamond setting',
            specifications: {
                metal: '18K Gold',
                weight: '12g total',
                stones: '0.5ct diamonds',
                design: 'Classic with modern twist',
            },
            quantity: 2,
            status: client_1.WorkOrderStatus.IN_PROGRESS,
            priority: client_1.WorkOrderPriority.HIGH,
            orderDate: new Date('2024-01-15'),
            startDate: new Date('2024-01-16'),
            expectedEndDate: new Date('2024-02-15'),
            costEstimate: 45000000,
            goldProvided: 12,
            stonesProvided: '20 small diamonds 0.5ct total',
            notes: 'Customer wants specific engraving',
        },
    });
    const workOrder2 = await prisma.workOrder.create({
        data: {
            orderNumber: 'WO-2024-002',
            workshopId: workshop2.id,
            productName: 'Stone Setting for Necklace',
            description: 'Set rubies into gold necklace',
            quantity: 1,
            status: client_1.WorkOrderStatus.COMPLETED,
            priority: client_1.WorkOrderPriority.MEDIUM,
            orderDate: new Date('2024-01-10'),
            startDate: new Date('2024-01-11'),
            expectedEndDate: new Date('2024-01-20'),
            completedDate: new Date('2024-01-19'),
            deliveredDate: new Date('2024-01-20'),
            costEstimate: 8000000,
            actualCost: 7500000,
            stonesProvided: '15 rubies',
            qualityRating: 5,
            qualityNotes: 'Excellent craftsmanship',
        },
    });
    // ============================================
    // 22. ATTENDANCE
    // ============================================
    console.log('📅 Creating attendance records...');
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    await prisma.attendance.createMany({
        data: [
            // Today
            {
                employeeId: employee1.id,
                date: today,
                checkIn: new Date(today.setHours(8, 30, 0)),
                checkOut: new Date(today.setHours(17, 0, 0)),
                hoursWorked: 8.5,
                status: client_1.AttendanceStatus.PRESENT,
            },
            {
                employeeId: employee2.id,
                date: today,
                checkIn: new Date(today.setHours(8, 45, 0)),
                checkOut: new Date(today.setHours(17, 15, 0)),
                hoursWorked: 8.5,
                status: client_1.AttendanceStatus.LATE,
                notes: '15 minutes late',
            },
            {
                employeeId: employee3.id,
                date: today,
                checkIn: new Date(today.setHours(8, 0, 0)),
                checkOut: new Date(today.setHours(16, 30, 0)),
                hoursWorked: 8.5,
                status: client_1.AttendanceStatus.PRESENT,
            },
            // Yesterday
            {
                employeeId: employee1.id,
                date: yesterday,
                checkIn: new Date(yesterday.setHours(8, 30, 0)),
                checkOut: new Date(yesterday.setHours(18, 0, 0)),
                hoursWorked: 9.5,
                overtime: 1.0,
                status: client_1.AttendanceStatus.PRESENT,
            },
            {
                employeeId: employee2.id,
                date: yesterday,
                checkIn: new Date(yesterday.setHours(8, 30, 0)),
                checkOut: new Date(yesterday.setHours(17, 0, 0)),
                hoursWorked: 8.5,
                status: client_1.AttendanceStatus.PRESENT,
            },
        ],
    });
    // ============================================
    // 23. LEAVE RECORDS
    // ============================================
    console.log('🏖️ Creating leave records...');
    await prisma.leave.createMany({
        data: [
            {
                employeeId: employee2.id,
                type: client_1.LeaveType.ANNUAL,
                status: client_1.LeaveStatus.APPROVED,
                startDate: new Date('2024-02-10'),
                endDate: new Date('2024-02-15'),
                days: 5,
                reason: 'Vacation with family',
                appliedAt: new Date('2024-01-15'),
                approvedBy: managerUser.id,
                approvedAt: new Date('2024-01-16'),
            },
            {
                employeeId: employee3.id,
                type: client_1.LeaveType.SICK,
                status: client_1.LeaveStatus.APPROVED,
                startDate: new Date('2024-01-18'),
                endDate: new Date('2024-01-19'),
                days: 2,
                reason: 'Medical appointment',
                appliedAt: new Date('2024-01-17'),
                approvedBy: managerUser.id,
                approvedAt: new Date('2024-01-17'),
            },
        ],
    });
    // ============================================
    // 24. PAYROLL
    // ============================================
    console.log('💰 Creating payroll records...');
    await prisma.payroll.createMany({
        data: [
            {
                employeeId: employee1.id,
                payPeriodStart: new Date('2024-01-01'),
                payPeriodEnd: new Date('2024-01-31'),
                payDate: new Date('2024-02-01'),
                baseSalary: 50000000,
                commission: 5000000, // Based on sales
                bonus: 3000000,
                overtime: 500000,
                allowances: 2000000,
                tax: 6000000,
                insurance: 3000000,
                loan: 0,
                otherDeductions: 500000,
                totalEarnings: 60500000,
                totalDeductions: 9500000,
                netSalary: 51000000,
                paymentMethod: client_1.PaymentMethod.BANK_TRANSFER,
                paid: true,
                paidAt: new Date('2024-02-01'),
            },
            {
                employeeId: employee2.id,
                payPeriodStart: new Date('2024-01-01'),
                payPeriodEnd: new Date('2024-01-31'),
                payDate: new Date('2024-02-01'),
                baseSalary: 35000000,
                commission: 3000000,
                bonus: 1000000,
                overtime: 0,
                allowances: 1500000,
                tax: 4000000,
                insurance: 2000000,
                loan: 0,
                otherDeductions: 300000,
                totalEarnings: 40500000,
                totalDeductions: 6300000,
                netSalary: 34200000,
                paymentMethod: client_1.PaymentMethod.BANK_TRANSFER,
                paid: true,
                paidAt: new Date('2024-02-01'),
            },
            {
                employeeId: employee3.id,
                payPeriodStart: new Date('2024-01-01'),
                payPeriodEnd: new Date('2024-01-31'),
                payDate: new Date('2024-02-01'),
                baseSalary: 45000000,
                commission: 0,
                bonus: 2000000,
                overtime: 0,
                allowances: 1500000,
                tax: 5000000,
                insurance: 2500000,
                loan: 0,
                otherDeductions: 0,
                totalEarnings: 48500000,
                totalDeductions: 7500000,
                netSalary: 41000000,
                paymentMethod: client_1.PaymentMethod.BANK_TRANSFER,
                paid: true,
                paidAt: new Date('2024-02-01'),
            },
        ],
    });
    // ============================================
    // 25. PERFORMANCE REVIEWS
    // ============================================
    console.log('📊 Creating performance reviews...');
    await prisma.performance.createMany({
        data: [
            {
                employeeId: employee1.id,
                reviewPeriod: '2024-Q1',
                reviewDate: new Date('2024-01-31'),
                totalSales: 323000000,
                targetSales: 300000000,
                achievementRate: 107.67,
                customersServed: 25,
                qualityScore: 9,
                punctualityScore: 10,
                teamworkScore: 9,
                overallRating: 5,
                strengths: 'Excellent customer service, high sales performance',
                weaknesses: 'Could improve in training new staff',
                feedback: 'Outstanding performance this quarter',
                goals: 'Achieve 350M in Q2, mentor 2 new staff',
                reviewedBy: adminUser.id,
            },
            {
                employeeId: employee2.id,
                reviewPeriod: '2024-Q1',
                reviewDate: new Date('2024-01-31'),
                totalSales: 171130000,
                targetSales: 150000000,
                achievementRate: 114.09,
                customersServed: 18,
                qualityScore: 8,
                punctualityScore: 7,
                teamworkScore: 9,
                overallRating: 4,
                strengths: 'Good sales skills, friendly with customers',
                weaknesses: 'Needs to work on punctuality',
                feedback: 'Great performance, exceeded targets',
                goals: 'Maintain sales level, improve attendance',
                reviewedBy: managerUser.id,
            },
        ],
    });
    // ============================================
    // 26. RETURNS
    // ============================================
    console.log('🔄 Creating return records...');
    await prisma.return.create({
        data: {
            returnNumber: 'RET-2024-001',
            returnDate: new Date('2024-01-26'),
            type: client_1.ReturnType.CUSTOMER_RETURN,
            status: client_1.ReturnStatus.COMPLETED,
            reason: client_1.ReturnReason.CUSTOMER_REQUEST,
            originalSaleId: sale1.id,
            customerId: customer1.id,
            reasonDetails: 'Customer changed mind, wants different design',
            refundAmount: 200000000,
            refundMethod: client_1.PaymentMethod.CASH,
            approvedBy: managerUser.id,
            approvedAt: new Date('2024-01-26'),
            notes: 'Item returned in perfect condition',
        },
    });
    // ============================================
    // 27. NOTIFICATIONS
    // ============================================
    console.log('🔔 Creating notifications...');
    await prisma.notification.createMany({
        data: [
            {
                type: client_1.NotificationType.LOW_INVENTORY,
                priority: client_1.NotificationPriority.HIGH,
                title: 'Low Inventory Alert',
                message: 'Product "Nim Bahar Azadi" is running low in Main Branch',
                userId: managerUser.id,
                actionUrl: '/inventory/coins',
                actionLabel: 'View Inventory',
                metadata: { productId: coin2.id, currentStock: 35, minimumStock: 15 },
            },
            {
                type: client_1.NotificationType.CHECK_DUE,
                priority: client_1.NotificationPriority.MEDIUM,
                title: 'Check Due Soon',
                message: 'Check CHK-001-2024 is due in 5 days',
                userId: accountantUser.id,
                actionUrl: '/financials/checks',
                actionLabel: 'View Checks',
                metadata: { checkId: check1.id, dueDate: '2024-02-25' },
            },
            {
                type: client_1.NotificationType.PAYMENT_OVERDUE,
                priority: client_1.NotificationPriority.URGENT,
                title: 'Overdue Payment',
                message: 'Customer Sara Alavi has an overdue installment',
                roleTarget: client_1.UserRole.MANAGER,
                actionUrl: '/financials/receivables',
                actionLabel: 'View Receivables',
            },
            {
                type: client_1.NotificationType.WORK_ORDER_DUE,
                priority: client_1.NotificationPriority.MEDIUM,
                title: 'Work Order Due',
                message: 'Work order WO-2024-001 is due in 10 days',
                userId: managerUser.id,
                actionUrl: '/management/workshops',
                actionLabel: 'View Work Orders',
            },
            {
                type: client_1.NotificationType.CUSTOMER_BIRTHDAY,
                priority: client_1.NotificationPriority.LOW,
                title: 'Customer Birthday',
                message: 'Customer Reza Mohammadi has a birthday coming up',
                roleTarget: client_1.UserRole.SALES_STAFF,
                actionUrl: '/management/customers',
                actionLabel: 'View Customer',
            },
        ],
    });
    // ============================================
    // 28. REMINDERS
    // ============================================
    console.log('⏰ Creating reminders...');
    await prisma.reminder.createMany({
        data: [
            {
                title: 'Follow up with customer',
                description: 'Call Sara Alavi about installment payment',
                dueDate: new Date('2024-02-20'),
                reminderTime: new Date('2024-02-20T10:00:00'),
                userId: salesUser1.id,
                notifyBefore: 60,
                relatedEntity: 'Customer',
                relatedEntityId: customer2.id,
            },
            {
                title: 'Check inventory levels',
                description: 'Review and reorder gold coins',
                dueDate: new Date('2024-02-01'),
                reminderTime: new Date('2024-02-01T09:00:00'),
                userId: managerUser.id,
                recurring: true,
                recurrence: client_1.ReminderRecurrence.MONTHLY,
                notifyBefore: 1440, // 1 day before
            },
            {
                title: 'Review workshop order',
                description: 'Check progress on custom wedding rings',
                dueDate: new Date('2024-02-10'),
                userId: managerUser.id,
                relatedEntity: 'WorkOrder',
                relatedEntityId: workOrder1.id,
            },
        ],
    });
    // ============================================
    // 29. SYSTEM SETTINGS
    // ============================================
    console.log('⚙️ Creating system settings...');
    await prisma.systemSetting.createMany({
        data: [
            // Company Settings
            {
                category: client_1.SettingCategory.COMPANY,
                key: 'company_name',
                value: 'Zarmind Jewelry Store',
                valueType: 'STRING',
                description: 'Company name',
                isPublic: true,
            },
            {
                category: client_1.SettingCategory.COMPANY,
                key: 'company_address',
                value: '123 Valiasr Street, Tehran, Iran',
                valueType: 'STRING',
                description: 'Company address',
                isPublic: true,
            },
            {
                category: client_1.SettingCategory.COMPANY,
                key: 'company_phone',
                value: '+98-21-12345678',
                valueType: 'STRING',
                description: 'Company phone',
                isPublic: true,
            },
            {
                category: client_1.SettingCategory.COMPANY,
                key: 'company_email',
                value: 'info@zarmind.com',
                valueType: 'STRING',
                description: 'Company email',
                isPublic: true,
            },
            {
                category: client_1.SettingCategory.COMPANY,
                key: 'company_tax_id',
                value: '1234567890',
                valueType: 'STRING',
                description: 'Tax identification number',
                isPublic: false,
            },
            // Tax Settings
            {
                category: client_1.SettingCategory.TAX,
                key: 'vat_rate',
                value: '9',
                valueType: 'NUMBER',
                description: 'VAT rate percentage',
                isPublic: false,
            },
            {
                category: client_1.SettingCategory.TAX,
                key: 'enable_tax',
                value: 'true',
                valueType: 'BOOLEAN',
                description: 'Enable tax calculation',
                isPublic: false,
            },
            // Currency Settings
            {
                category: client_1.SettingCategory.CURRENCY,
                key: 'default_currency',
                value: 'IRR',
                valueType: 'STRING',
                description: 'Default currency',
                isPublic: true,
            },
            {
                category: client_1.SettingCategory.CURRENCY,
                key: 'currency_symbol',
                value: 'ریال',
                valueType: 'STRING',
                description: 'Currency symbol',
                isPublic: true,
            },
            {
                category: client_1.SettingCategory.CURRENCY,
                key: 'decimal_places',
                value: '0',
                valueType: 'NUMBER',
                description: 'Decimal places for currency',
                isPublic: true,
            },
            // General Settings
            {
                category: client_1.SettingCategory.GENERAL,
                key: 'date_format',
                value: 'YYYY-MM-DD',
                valueType: 'STRING',
                description: 'Date format',
                isPublic: true,
            },
            {
                category: client_1.SettingCategory.GENERAL,
                key: 'time_format',
                value: '24h',
                valueType: 'STRING',
                description: 'Time format (12h/24h)',
                isPublic: true,
            },
            {
                category: client_1.SettingCategory.GENERAL,
                key: 'language',
                value: 'fa',
                valueType: 'STRING',
                description: 'Default language (fa/en)',
                isPublic: true,
            },
            {
                category: client_1.SettingCategory.GENERAL,
                key: 'timezone',
                value: 'Asia/Tehran',
                valueType: 'STRING',
                description: 'Default timezone',
                isPublic: true,
            },
            // Email Settings
            {
                category: client_1.SettingCategory.EMAIL,
                key: 'smtp_host',
                value: 'smtp.example.com',
                valueType: 'STRING',
                description: 'SMTP host',
                isPublic: false,
            },
            {
                category: client_1.SettingCategory.EMAIL,
                key: 'smtp_port',
                value: '587',
                valueType: 'NUMBER',
                description: 'SMTP port',
                isPublic: false,
            },
            {
                category: client_1.SettingCategory.EMAIL,
                key: 'email_from',
                value: 'noreply@zarmind.com',
                valueType: 'STRING',
                description: 'From email address',
                isPublic: false,
            },
            // Notification Settings
            {
                category: client_1.SettingCategory.NOTIFICATION,
                key: 'low_stock_threshold',
                value: '5',
                valueType: 'NUMBER',
                description: 'Low stock notification threshold',
                isPublic: false,
            },
            {
                category: client_1.SettingCategory.NOTIFICATION,
                key: 'check_due_reminder_days',
                value: '7',
                valueType: 'NUMBER',
                description: 'Days before check due to send reminder',
                isPublic: false,
            },
            {
                category: client_1.SettingCategory.NOTIFICATION,
                key: 'enable_email_notifications',
                value: 'true',
                valueType: 'BOOLEAN',
                description: 'Enable email notifications',
                isPublic: false,
            },
            {
                category: client_1.SettingCategory.NOTIFICATION,
                key: 'enable_sms_notifications',
                value: 'false',
                valueType: 'BOOLEAN',
                description: 'Enable SMS notifications',
                isPublic: false,
            },
            // Security Settings
            {
                category: client_1.SettingCategory.SECURITY,
                key: 'session_timeout',
                value: '30',
                valueType: 'NUMBER',
                description: 'Session timeout in minutes',
                isPublic: false,
            },
            {
                category: client_1.SettingCategory.SECURITY,
                key: 'password_min_length',
                value: '8',
                valueType: 'NUMBER',
                description: 'Minimum password length',
                isPublic: false,
            },
            {
                category: client_1.SettingCategory.SECURITY,
                key: 'require_strong_password',
                value: 'true',
                valueType: 'BOOLEAN',
                description: 'Require strong password',
                isPublic: false,
            },
            // Integration Settings
            {
                category: client_1.SettingCategory.INTEGRATION,
                key: 'gold_price_api_url',
                value: 'https://api.goldprice.com',
                valueType: 'STRING',
                description: 'Gold price API URL',
                isPublic: false,
            },
            {
                category: client_1.SettingCategory.INTEGRATION,
                key: 'exchange_rate_api_url',
                value: 'https://api.exchangerate.com',
                valueType: 'STRING',
                description: 'Exchange rate API URL',
                isPublic: false,
            },
            {
                category: client_1.SettingCategory.INTEGRATION,
                key: 'enable_auto_price_update',
                value: 'true',
                valueType: 'BOOLEAN',
                description: 'Enable automatic price updates',
                isPublic: false,
            },
            // Backup Settings
            {
                category: client_1.SettingCategory.BACKUP,
                key: 'auto_backup_enabled',
                value: 'true',
                valueType: 'BOOLEAN',
                description: 'Enable automatic backups',
                isPublic: false,
            },
            {
                category: client_1.SettingCategory.BACKUP,
                key: 'backup_frequency',
                value: 'daily',
                valueType: 'STRING',
                description: 'Backup frequency (daily/weekly/monthly)',
                isPublic: false,
            },
            {
                category: client_1.SettingCategory.BACKUP,
                key: 'backup_retention_days',
                value: '30',
                valueType: 'NUMBER',
                description: 'Number of days to keep backups',
                isPublic: false,
            },
        ],
    });
    // ============================================
    // 30. DOCUMENTS
    // ============================================
    console.log('📄 Creating documents...');
    await prisma.document.createMany({
        data: [
            {
                fileName: 'employee1-contract.pdf',
                originalName: 'Ali_Rezaei_Employment_Contract.pdf',
                filePath: '/documents/employees/employee1-contract.pdf',
                fileSize: 245000,
                mimeType: 'application/pdf',
                type: client_1.DocumentType.CONTRACT,
                relatedEntity: 'Employee',
                relatedEntityId: employee1.id,
                description: 'Employment contract for Ali Rezaei',
                tags: ['contract', 'employment', 'legal'],
                uploadedBy: adminUser.id,
            },
            {
                fileName: 'customer1-id.jpg',
                originalName: 'Reza_Mohammadi_ID.jpg',
                filePath: '/documents/customers/customer1-id.jpg',
                fileSize: 1200000,
                mimeType: 'image/jpeg',
                type: client_1.DocumentType.ID_DOCUMENT,
                relatedEntity: 'Customer',
                relatedEntityId: customer1.id,
                description: 'National ID copy',
                tags: ['id', 'kyc'],
                uploadedBy: salesUser1.id,
            },
            {
                fileName: 'diamond-cert-123456789.pdf',
                originalName: 'GIA_Certificate_123456789.pdf',
                filePath: '/documents/products/diamond-cert-123456789.pdf',
                fileSize: 890000,
                mimeType: 'application/pdf',
                type: client_1.DocumentType.CERTIFICATE,
                relatedEntity: 'Product',
                relatedEntityId: stone1.id,
                description: 'GIA certificate for 2ct diamond',
                tags: ['certificate', 'diamond', 'gia'],
                uploadedBy: managerUser.id,
            },
            {
                fileName: 'expense-receipt-001.jpg',
                originalName: 'Office_Supplies_Receipt.jpg',
                filePath: '/documents/expenses/expense-receipt-001.jpg',
                fileSize: 450000,
                mimeType: 'image/jpeg',
                type: client_1.DocumentType.EXPENSE_RECEIPT,
                description: 'Receipt for office supplies',
                tags: ['receipt', 'expense'],
                uploadedBy: accountantUser.id,
            },
        ],
    });
    // ============================================
    // 31. QR CODE SCANS
    // ============================================
    console.log('📱 Creating QR code scan records...');
    await prisma.qRCodeScan.createMany({
        data: [
            {
                qrCode: 'QR-RING-001',
                productId: product1.id,
                scannedBy: salesUser1.id,
                scannedAt: new Date('2024-01-20T10:30:00'),
                purpose: 'SALE',
                location: mainBranch.id,
            },
            {
                qrCode: 'QR-NECK-001',
                productId: product2.id,
                scannedBy: salesUser2.id,
                scannedAt: new Date('2024-01-25T14:15:00'),
                purpose: 'SALE',
                location: branch2.id,
            },
            {
                qrCode: 'QR-RING-001',
                productId: product1.id,
                scannedAt: new Date('2024-01-18T16:45:00'),
                purpose: 'LOOKUP',
                ipAddress: '192.168.1.100',
                userAgent: 'Mozilla/5.0...',
            },
            {
                qrCode: 'QR-COIN-BA-001',
                productId: coin1.id,
                scannedBy: managerUser.id,
                scannedAt: new Date('2024-01-15T09:00:00'),
                purpose: 'INVENTORY_CHECK',
                location: mainBranch.id,
            },
        ],
    });
    // ============================================
    // 32. AUDIT LOGS
    // ============================================
    console.log('📋 Creating audit logs...');
    await prisma.auditLog.createMany({
        data: [
            {
                userId: adminUser.id,
                action: 'LOGIN',
                entityType: 'User',
                entityId: adminUser.id,
                newValue: { loginTime: new Date(), ipAddress: '192.168.1.1' },
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0...',
            },
            {
                userId: salesUser1.id,
                action: 'CREATE',
                entityType: 'Sale',
                entityId: sale1.id,
                newValue: { invoiceNumber: 'INV-2024-001', totalAmount: 213000000 },
                ipAddress: '192.168.1.50',
            },
            {
                userId: managerUser.id,
                action: 'UPDATE',
                entityType: 'Product',
                entityId: product1.id,
                oldValue: { sellingPrice: 195000000 },
                newValue: { sellingPrice: 200000000 },
                ipAddress: '192.168.1.10',
            },
            {
                userId: accountantUser.id,
                action: 'CREATE',
                entityType: 'Expense',
                newValue: { category: 'Utilities', amount: 5000000 },
                ipAddress: '192.168.1.30',
            },
            {
                userId: managerUser.id,
                action: 'APPROVE',
                entityType: 'Return',
                newValue: { returnNumber: 'RET-2024-001', status: 'APPROVED' },
                ipAddress: '192.168.1.10',
            },
        ],
    });
    // ============================================
    // 33. REPORT CACHE
    // ============================================
    console.log('📊 Creating report cache...');
    await prisma.reportCache.createMany({
        data: [
            {
                reportType: 'PROFIT_LOSS',
                reportName: 'Monthly Profit & Loss - January 2024',
                parameters: {
                    startDate: '2024-01-01',
                    endDate: '2024-01-31',
                    branchId: mainBranch.id,
                },
                data: {
                    revenue: 493130000,
                    costOfGoodsSold: 350000000,
                    grossProfit: 143130000,
                    operatingExpenses: 60000000,
                    netProfit: 83130000,
                },
                generatedAt: new Date(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                generatedBy: accountantUser.id,
            },
            {
                reportType: 'INVENTORY_VALUATION',
                reportName: 'Inventory Valuation Report',
                parameters: {
                    asOfDate: '2024-01-31',
                    branchId: mainBranch.id,
                },
                data: {
                    totalInventoryValue: 2500000000,
                    byCategory: {
                        RAW_GOLD: 1325000000,
                        MANUFACTURED_PRODUCT: 565000000,
                        STONE: 250000000,
                        COIN: 300000000,
                        CURRENCY: 50000000,
                        GENERAL_GOODS: 10000000,
                    },
                },
                generatedAt: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                generatedBy: managerUser.id,
            },
        ],
    });
    console.log('✅ Seed completed successfully!');
    console.log('\n📊 Summary:');
    console.log('- 3 Branches');
    console.log('- 4 Employees');
    console.log('- 5 Users');
    console.log('- 4 Customers');
    console.log('- 3 Suppliers');
    console.log('- 2 Workshops');
    console.log('- 17 Products (Raw Gold, Manufactured, Stones, Coins, Currency, Goods)');
    console.log('- 21 Inventory entries');
    console.log('- 3 Bank Accounts');
    console.log('- 2 Purchases');
    console.log('- 3 Sales');
    console.log('- 1 Accounts Receivable with 3 Installments');
    console.log('- 1 Accounts Payable');
    console.log('- 3 Checks');
    console.log('- 4 Cash Transactions');
    console.log('- 6 Expense Categories');
    console.log('- 5 Expenses');
    console.log('- 2 Work Orders');
    console.log('- 5 Attendance Records');
    console.log('- 2 Leave Records');
    console.log('- 3 Payroll Records');
    console.log('- 2 Performance Reviews');
    console.log('- 1 Return');
    console.log('- 5 Notifications');
    console.log('- 3 Reminders');
    console.log('- 30+ System Settings');
    console.log('- 4 Documents');
    console.log('- 4 QR Code Scans');
    console.log('- 5 Audit Logs');
    console.log('- 2 Report Cache entries');
    console.log('\n🔐 Default Login Credentials:');
    console.log('Admin: admin@zarmind.com / Admin@123');
    console.log('Manager: manager@zarmind.com / Admin@123');
    console.log('Sales: fatima@zarmind.com / Admin@123');
    console.log('Accountant: accountant@zarmind.com / Admin@123');
}
main()
    .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map