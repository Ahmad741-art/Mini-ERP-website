const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Article = require('../models/Article');
const Order = require('../models/Order');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Rensa befintlig data
    console.log('Rensar befintlig data...');
    await User.deleteMany();
    await Article.deleteMany();
    await Order.deleteMany();

    // Skapa användare
    console.log('Skapar användare...');
    const users = await User.create([
      {
        name: 'Admin Användare',
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
    console.log(`✓ ${users.length} användare skapade`);

    // Skapa artiklar
    console.log('Skapar artiklar...');
    const articles = await Article.create([
      {
        articleNumber: 'ART001',
        name: 'Skrivbordsstol Premium',
        description: 'Ergonomisk kontorsstol med justerbar höjd',
        price: 2499,
        cost: 1200,
        stockQuantity: 25,
        minStockLevel: 5,
        category: 'Möbler',
        unit: 'st'
      },
      {
        articleNumber: 'ART002',
        name: 'Laptop Dell XPS 15',
        description: '15.6" bärbar dator, i7, 16GB RAM',
        price: 15990,
        cost: 12000,
        stockQuantity: 8,
        minStockLevel: 3,
        category: 'Elektronik',
        unit: 'st'
      },
      {
        articleNumber: 'ART003',
        name: 'Whiteboard 120x90cm',
        description: 'Magnetisk whiteboard med pennfack',
        price: 899,
        cost: 450,
        stockQuantity: 15,
        minStockLevel: 5,
        category: 'Kontorsmaterial',
        unit: 'st'
      },
      {
        articleNumber: 'ART004',
        name: 'Skrivarpapper A4',
        description: 'Kopieringspapper 80g, 500 ark/paket',
        price: 45,
        cost: 25,
        stockQuantity: 200,
        minStockLevel: 50,
        category: 'Kontorsmaterial',
        unit: 'paket'
      },
      {
        articleNumber: 'ART005',
        name: 'USB-C Hub 7-port',
        description: 'Hub med HDMI, USB 3.0 och kortläsare',
        price: 399,
        cost: 200,
        stockQuantity: 30,
        minStockLevel: 10,
        category: 'Elektronik',
        unit: 'st'
      },
      {
        articleNumber: 'ART006',
        name: 'Höj och sänkbart skrivbord',
        description: 'Elektriskt justerbart 120x80cm',
        price: 4999,
        cost: 3000,
        stockQuantity: 3,
        minStockLevel: 5,
        category: 'Möbler',
        unit: 'st'
      },
      {
        articleNumber: 'ART007',
        name: 'Trådlös mus Logitech MX',
        description: 'Ergonomisk trådlös mus',
        price: 799,
        cost: 450,
        stockQuantity: 45,
        minStockLevel: 15,
        category: 'Elektronik',
        unit: 'st'
      },
      {
        articleNumber: 'ART008',
        name: 'Mekaniskt tangentbord',
        description: 'RGB-belysning, Cherry MX Brown',
        price: 1299,
        cost: 700,
        stockQuantity: 20,
        minStockLevel: 8,
        category: 'Elektronik',
        unit: 'st'
      },
      {
        articleNumber: 'ART009',
        name: 'Hörlurar Sony WH-1000XM5',
        description: 'Brusreducerande trådlösa hörlurar',
        price: 3990,
        cost: 2500,
        stockQuantity: 2,
        minStockLevel: 5,
        category: 'Elektronik',
        unit: 'st'
      },
      {
        articleNumber: 'ART010',
        name: 'Monitor 27" 4K',
        description: 'IPS-panel, USB-C, höjdjusterbar',
        price: 5499,
        cost: 3500,
        stockQuantity: 12,
        minStockLevel: 4,
        category: 'Elektronik',
        unit: 'st'
      }
    ]);
    console.log(`✓ ${articles.length} artiklar skapade`);

    // Skapa några testordrar
    console.log('Skapar testordrar...');
    const orders = await Order.create([
      {
        customer: {
          name: 'Företag AB',
          email: 'order@foretagab.se',
          phone: '08-123456',
          address: {
            street: 'Storgatan 1',
            postalCode: '11122',
            city: 'Stockholm',
            country: 'Sverige'
          }
        },
        orderLines: [
          {
            article: articles[0]._id,
            articleNumber: articles[0].articleNumber,
            articleName: articles[0].name,
            quantity: 5,
            price: articles[0].price
          },
          {
            article: articles[2]._id,
            articleNumber: articles[2].articleNumber,
            articleName: articles[2].name,
            quantity: 3,
            price: articles[2].price
          }
        ],
        status: 'ready_to_pick',
        createdBy: users[0]._id
      },
      {
        customer: {
          name: 'Tech Solutions HB',
          email: 'kontakt@techsolutions.se',
          phone: '031-987654',
          address: {
            street: 'Teknikvägen 5',
            postalCode: '41234',
            city: 'Göteborg',
            country: 'Sverige'
          }
        },
        orderLines: [
          {
            article: articles[1]._id,
            articleNumber: articles[1].articleNumber,
            articleName: articles[1].name,
            quantity: 2,
            price: articles[1].price
          },
          {
            article: articles[4]._id,
            articleNumber: articles[4].articleNumber,
            articleName: articles[4].name,
            quantity: 5,
            price: articles[4].price
          }
        ],
        status: 'ready_to_pick',
        createdBy: users[0]._id
      },
      {
        customer: {
          name: 'Startup Innovations',
          email: 'hello@startup.se',
          phone: '070-1234567',
          address: {
            street: 'Innovation Street 12',
            postalCode: '21143',
            city: 'Malmö',
            country: 'Sverige'
          }
        },
        orderLines: [
          {
            article: articles[5]._id,
            articleNumber: articles[5].articleNumber,
            articleName: articles[5].name,
            quantity: 1,
            price: articles[5].price
          }
        ],
        status: 'not_ready',
        notes: 'Väntar på lagerpåfyllning av höj/sänk-bord',
        createdBy: users[0]._id
      }
    ]);
    console.log(`✓ ${orders.length} ordrar skapade`);

    console.log('\n═══════════════════════════════════════');
    console.log('✓ Databas seedning klar!');
    console.log('═══════════════════════════════════════');
    console.log('\nInloggningsuppgifter:');
    console.log('\nAdmin:');
    console.log('  Email: admin@miniorp.se');
    console.log('  Lösenord: admin123');
    console.log('\nLager:');
    console.log('  Email: lager@miniorp.se');
    console.log('  Lösenord: lager123');
    console.log('\nEkonomi:');
    console.log('  Email: ekonomi@miniorp.se');
    console.log('  Lösenord: ekonomi123');
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('Fel vid seedning:', error);
    process.exit(1);
  }
};

connectDB().then(() => seedData());