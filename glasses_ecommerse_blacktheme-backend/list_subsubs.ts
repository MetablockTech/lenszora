import mongoose from 'mongoose';
import * as fs from 'fs';

async function run() {
    try {
        await mongoose.connect('mongodb://localhost:27017/sunglasses-marketplace');
        const db = mongoose.connection.db;
        const genderNames = ['Men', 'Women', 'Kids', 'Unisex'];

        const log = (msg: string) => {
            console.log(msg);
            fs.appendFileSync('subsub_details.txt', msg + '\n', 'utf8');
        };

        if (fs.existsSync('subsub_details.txt')) fs.unlinkSync('subsub_details.txt');

        const genderCats = await db.collection('categories').find({
            level: 'sub',
            name: { $in: genderNames }
        }).toArray();

        for (const cat of genderCats) {
            const parent = await db.collection('categories').findOne({ _id: cat.parentId });
            log(`Container: "${cat.name}" (Sub) inside "${parent ? parent.name : 'Unknown'}"`);

            const children = await db.collection('categories').find({ parentId: cat._id }).toArray();
            log(`  Children (${children.length}):`);
            children.forEach(c => {
                log(`    - "${c.name}" (Level: ${c.level}, _id: ${c._id})`);
            });
            log('---');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
