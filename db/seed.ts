import mongoose from "mongoose";
import Artist from "../models/artist";
import Release from "../models/release";
import Users from "../models/user";
import dotenv from 'dotenv';

dotenv.config();

// Define the admin user
const adminUser = {
  username: 'ws-bit',
  email: 'wsbit@gmail.com',
  password: process.env.ADMIN_PASSWORD,
  confirmPassword: process.env.ADMIN_PASSWORD
};

async function seed() {
  try {
    console.log('Trying to connect!')
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected!')

    // Clear existing data
    await Release.deleteMany({});
    await Artist.deleteMany({});
    await Users.deleteMany({});

    const user = await Users.create(adminUser);
    console.log('Created user: ', user)

    const artistData = [
      {
        name: "Bon Iver",
        genre: "Indie Folk",
        image: "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcS3zTlVsboK8tY51pAgHLJnDzFQ7NfNnUWl7N1kGKnmQDl0WW6l",
        country: "United States of America",
        formedYear: 2006,
        biography: "Bon Iver is an American indie folk band founded in 2006 by singer-songwriter Justin Vernon.",
        user: user._id,
      },
    ];

    const [artist] = await Artist.create(artistData);

    const releaseData = [
      {
        title: '22, A Million',
        image: 'https://media.pitchfork.com/photos/5935a1014fc0406ca110ccc9/master/pass/fd8402f9.jpg',
        artist: artist._id,
        year: 2016,
        genre: 'Electronic Folk',
        trackList: "",
        releaseType: 'Album',
        user: user._id,
      },
    ];

    const [release] = await Release.create(releaseData);

    // Update the artist with the new release
    await Artist.findByIdAndUpdate(artist._id, { $push: { releases: release._id } });

    console.log('Data seeded successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seed();