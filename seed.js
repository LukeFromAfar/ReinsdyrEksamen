const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
require('dotenv').config();
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const Eier = require('./models/EierSchema');
const Flokk = require('./models/FlokkSchema');
const Reinsdyr = require('./models/ReinsdyrSchema');
const Beiteomraade = require('./models/BeiteomradeSchema');

const createMockData = async () => {
  try {
    const saltRounds = parseInt(process.env.SALT_ROUNDS);
    await mongoose.connect(process.env.MONGODB_URI);

    // Clear existing data
    await Promise.all([
      Eier.deleteMany(),
      Flokk.deleteMany(),
      Reinsdyr.deleteMany(),
      Beiteomraade.deleteMany()
    ]);

    // Create beiteområder
    const beiteomraader = await Beiteomraade.create([
      { beiteomraade: 'Akkala', fylker: ['Murmansk Oblast'] },
      { beiteomraade: 'Enare Skolt', fylker: ['Lapland'] },
      { beiteomraade: 'Kildin', fylker: ['Murmansk Oblast'] },
      { beiteomraade: 'Nord', fylker: ['Troms og Finnmark', 'Nordland'] },
      { beiteomraade: 'Pite', fylker: ['Nordland', 'Västerbotten'] },
      { beiteomraade: 'Sør', fylker: ['Trøndelag', 'Hedmark'] },
      { beiteomraade: 'Ter', fylker: ['Murmansk Oblast'] },
      { beiteomraade: 'Ume', fylker: ['Västerbotten', 'Nordland'] }
    ]);

    // Create two owners
    const owners = await Eier.create([
      {
        navn: 'Ola Nordmann',
        epost: 'ola@reinsdyr.no',
        passord: await bcrypt.hash(process.env.SEED_USER_PASSWORD, saltRounds),
        kontaktsprak: 'Norsk',
        telefonnummer: 12345678
      },
      {
        navn: 'Kari Nordmann',
        epost: 'kari@reinsdyr.no',
        passord: await bcrypt.hash(process.env.SEED_USER_PASSWORD, saltRounds),
        kontaktsprak: 'Svensk',
        telefonnummer: 87654321
      }
    ]);

    // Rename and use buemerke images
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    const originalImages = ['buemerke1.png', 'buemerke2.png', 'buemerke3.png', 'buemerke4.png'];
    const renamedImages = originalImages.map(image => {
      const newName = `${Date.now()}-${image}`;
      fs.renameSync(path.join(uploadsDir, image), path.join(uploadsDir, newName));
      return newName;
    });

    // Create flocks and reindeer for each owner
    for (const owner of owners) {
      // Create two flocks per owner
      const flocks = await Flokk.create([
        {
          eier: [owner._id],
          navn: `${owner.navn.split(' ')[0]}s Hovedflokk`,
          buemerkeNavn: 'Hovedbuemerke',
          buemerkeBilde: path.join('uploads', renamedImages[Math.floor(Math.random() * renamedImages.length)]),
          beiteomraader: [beiteomraader[Math.floor(Math.random() * beiteomraader.length)]._id]
        },
        {
          eier: [owner._id],
          navn: `${owner.navn.split(' ')[0]}s Biflokk`,
          buemerkeNavn: 'Bibuemerke',
          buemerkeBilde: path.join('uploads', renamedImages[Math.floor(Math.random() * renamedImages.length)]),
          beiteomraader: [beiteomraader[Math.floor(Math.random() * beiteomraader.length)]._id]
        }
      ]);

      // Create reindeer for each flock
      for (const [index, flock] of flocks.entries()) {
        const reindeerCount = index === 0 ? 21 : 10;
        const reindeers = Array.from({ length: reindeerCount }, () => ({
          navn: faker.animal.cow(),
          fodselsdato: faker.date.between({ 
            from: '2015-01-01',
            to: '2025-02-26'
          }),
          flokk: flock._id
        }));

        await Reinsdyr.insertMany(reindeers);
      }
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

createMockData();
