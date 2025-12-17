require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Article = require('../models/Article');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');

// Fallback to hardcoded URI if .env doesn't load
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mini-erp';

console.log('Using MongoDB URI:', MONGO_URI);

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany();
    await Article.deleteMany();
    await Order.deleteMany();
    await Invoice.deleteMany();

    // Create users
    console.log('Creating users...');
    const users = await User.create([
      {
        name: 'Admin User',
        email: 'admin@miniorp.se',
        password: 'admin123',
        role: 'admin'
      },
      {
        name: 'Lager Ansvarig',
        email: 'lager@miniorp.se',
        password: 'lager123',
        role: 'lager'
      },
      {
        name: 'Ekonomi Ansvarig',
        email: 'ekonomi@miniorp.se',
        password: 'ekonomi123',
        role: 'ekonomi'
      }
    ]);

    console.log(`Created ${users.length} users`);

    // Create articles
    console.log('Creating articles...');
    const articles = await Article.create([
      {
        articleNumber: 'ART-001',
        name: 'Kontorsstol Premium',
        category: 'Möbler',
        stockQuantity: 50,
        reservedQuantity: 0,
        minStockLevel: 10,
        unit: 'st',
        price: 2500
      },
      {
        articleNumber: 'ART-002',
        name: 'Skrivbord 160x80',
        category: 'Möbler',
        stockQuantity: 30,
        reservedQuantity: 0,
        minStockLevel: 5,
        unit: 'st',
        price: 4500
      },
      {
        articleNumber: 'ART-003',
        name: 'Laptop Dell XPS 15',
        category: 'Elektronik',
        stockQuantity: 15,
        reservedQuantity: 0,
        minStockLevel: 5,
        unit: 'st',
        price: 18000
      },
      {
        articleNumber: 'ART-004',
        name: 'Datormus Logitech',
        category: 'Elektronik',
        stockQuantity: 100,
        reservedQuantity: 0,
        minStockLevel: 20,
        unit: 'st',
        price: 350
      },
      {
        articleNumber: 'ART-005',
        name: 'Papper A4 500 ark',
        category: 'Kontorsmaterial',
        stockQuantity: 200,
        reservedQuantity: 0,
        minStockLevel: 50,
        unit: 'paket',
        price: 45
      },
      {
        articleNumber: 'ART-006',
        name: 'Pennor BIC 10-pack',
        category: 'Kontorsmaterial',
        stockQuantity: 8,
        reservedQuantity: 0,
        minStockLevel: 20,
        unit: 'förp',
        price: 25
      },
      {
        articleNumber: 'ART-007',
        name: 'Whiteboard 120x90',
        category: 'Möbler',
        stockQuantity: 12,
        reservedQuantity: 0,
        minStockLevel: 3,
        unit: 'st',
        price: 1200
      },
      {
        articleNumber: 'ART-008',
        name: 'Headset Jabra Evolve2',
        category: 'Elektronik',
        stockQuantity: 25,
        reservedQuantity: 0,
        minStockLevel: 10,
        unit: 'st',
        price: 2200
      }
    ]);

    console.log(`Created ${articles.length} articles`);

    // Create orders
    console.log('Creating orders...');
    const orders = await Order.create([
      {
        orderNumber: 'ORD-2024-001',
        customer: {
          name: 'Acme Corp AB',
          email: 'order@acme.se',
          phone: '08-123456',
          address: 'Storgatan 1, 111 22 Stockholm'
        },
        orderLines: [
          {
            article: articles[0]._id,
            articleNumber: articles[0].articleNumber,
            articleName: articles[0].name,
            quantity: 10,
            unitPrice: articles[0].price,
            totalPrice: articles[0].price * 10
          },
          {
            article: articles[1]._id,
            articleNumber: articles[1].articleNumber,
            articleName: articles[1].name,
            quantity: 5,
            unitPrice: articles[1].price,
            totalPrice: articles[1].price * 5
          }
        ],
        status: 'not_ready',
        totalAmount: (articles[0].price * 10) + (articles[1].price * 5)
      },
      {
        orderNumber: 'ORD-2024-002',
        customer: {
          name: 'TechStart AB',
          email: 'inkop@techstart.se',
          phone: '08-654321',
          address: 'Vasagatan 10, 111 20 Stockholm'
        },
        orderLines: [
          {
            article: articles[2]._id,
            articleNumber: articles[2].articleNumber,
            articleName: articles[2].name,
            quantity: 3,
            unitPrice: articles[2].price,
            totalPrice: articles[2].price * 3
          },
          {
            article: articles[7]._id,
            articleNumber: articles[7].articleNumber,
            articleName: articles[7].name,
            quantity: 3,
            unitPrice: articles[7].price,
            totalPrice: articles[7].price * 3
          }
        ],
        status: 'ready_to_pick',
        totalAmount: (articles[2].price * 3) + (articles[7].price * 3)
      },
      {
        orderNumber: 'ORD-2024-003',
        customer: {
          name: 'Kontorsbolaget Sverige AB',
          email: 'order@kontorsbolaget.se',
          phone: '08-789012',
          address: 'Kungsgatan 25, 111 43 Stockholm'
        },
        orderLines: [
          {
            article: articles[4]._id,
            articleNumber: articles[4].articleNumber,
            articleName: articles[4].name,
            quantity: 50,
            unitPrice: articles[4].price,
            totalPrice: articles[4].price * 50,
            isPicked: true,
            pickedQuantity: 50
          },
          {
            article: articles[5]._id,
            articleNumber: articles[5].articleNumber,
            articleName: articles[5].name,
            quantity: 20,
            unitPrice: articles[5].price,
            totalPrice: articles[5].price * 20,
            isPicked: true,
            pickedQuantity: 20
          }
        ],
        status: 'picked',
        totalAmount: (articles[4].price * 50) + (articles[5].price * 20)
      }
    ]);

    console.log(`Created ${orders.length} orders`);

    // Update article reserved quantities for ready_to_pick orders
    await Article.findByIdAndUpdate(articles[2]._id, { $inc: { reservedQuantity: 3 } });
    await Article.findByIdAndUpdate(articles[7]._id, { $inc: { reservedQuantity: 3 } });

    // Create invoices
    console.log('Creating invoices...');
    const invoices = await Invoice.create([
      {
        invoiceNumber: 'INV-2024-001',
        order: orders[2]._id,
        orderNumber: orders[2].orderNumber,
        customer: orders[2].customer,
        invoiceLines: orders[2].orderLines.map(line => ({
          description: line.articleName,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          totalPrice: line.totalPrice
        })),
        subtotal: orders[2].totalAmount,
        vatAmount: orders[2].totalAmount * 0.25,
        totalAmount: orders[2].totalAmount * 1.25,
        status: 'sent',
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    ]);

    console.log(`Created ${invoices.length} invoices`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Articles: ${articles.length}`);
    console.log(`   Orders: ${orders.length}`);
    console.log(`   Invoices: ${invoices.length}`);
    console.log('\n👤 Demo Users:');
    console.log('   Admin: admin@miniorp.se / admin123');
    console.log('   Lager: lager@miniorp.se / lager123');
    console.log('   Ekonomi: ekonomi@miniorp.se / ekonomi123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();