import mongoose from 'mongoose';
import * as fs from 'fs';

async function run() {
    try {
        await mongoose.connect('mongodb://localhost:27017/sunglasses-marketplace');
        const db = mongoose.connection.db;

        const log = (msg: string) => {
            console.log(msg);
            fs.appendFileSync('migration_log.txt', msg + '\n', 'utf8');
        };

        if (fs.existsSync('migration_log.txt')) fs.unlinkSync('migration_log.txt');
        log('Starting migration at ' + new Date().toISOString());

        const genderNames = ['Men', 'Women', 'Kids', 'Unisex'];

        // 1. Find all gender subcategories (level: sub)
        const genderCats = await db.collection('categories').find({
            level: 'sub',
            name: { $in: genderNames }
        }).toArray();

        log(`Found ${genderCats.length} gender containers to process.`);

        for (const genderCat of genderCats) {
            const mainCategoryId = genderCat.parentId;
            const mainCategory = await db.collection('categories').findOne({ _id: mainCategoryId });

            if (!mainCategory) {
                log(`Skipping gender category "${genderCat.name}" (${genderCat._id}) because parent is missing.`);
                continue;
            }

            log(`Processing "${genderCat.name}" under "${mainCategory.name}"...`);

            // 2. Find all sub-subcategories under this gender category
            const subSubCats = await db.collection('categories').find({
                parentId: genderCat._id
            }).toArray();

            for (const subsub of subSubCats) {
                log(`  Migrating sub-sub "${subsub.name}"...`);

                // a. Find or create the target subcategory directly under MainCategory
                let targetSubId;
                const existingSub = await db.collection('categories').findOne({
                    parentId: mainCategoryId,
                    name: subsub.name,
                    level: 'sub'
                });

                if (existingSub) {
                    targetSubId = existingSub._id;
                    log(`    Found existing target subcategory: "${subsub.name}" (${targetSubId})`);
                } else {
                    // Create it
                    const newSub = {
                        name: subsub.name,
                        slug: subsub.slug, // Might need to be careful with slug collisions, but since they are in different parents it should be fine if unique globally
                        parentId: mainCategoryId,
                        level: 'sub',
                        description: subsub.description,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        __v: 0
                    };
                    const insertResult = await db.collection('categories').insertOne(newSub);
                    targetSubId = insertResult.insertedId;
                    log(`    Created new target subcategory: "${subsub.name}" (${targetSubId})`);
                }

                // b. Move all products from subsub to targetSub
                const updateResult = await db.collection('products').updateMany(
                    { category: subsub._id },
                    { $set: { category: targetSubId } }
                );
                log(`    Moved ${updateResult.modifiedCount} products.`);

                // c. Delete the sub-subcategory
                await db.collection('categories').deleteOne({ _id: subsub._id });
                log(`    Deleted sub-subcategory "${subsub.name}".`);
            }

            // 3. Move any products that might have been directly in the gender category (just in case)
            const looseProducts = await db.collection('products').updateMany(
                { category: genderCat._id },
                { $set: { category: mainCategoryId } } // Or we could try to determine a better fallback, but the research said 0
            );
            if (looseProducts.modifiedCount > 0) {
                log(`  Moved ${looseProducts.modifiedCount} loose products from "${genderCat.name}" to "${mainCategory.name}".`);
            }

            // 4. Delete the gender category
            await db.collection('categories').deleteOne({ _id: genderCat._id });
            log(`  Deleted gender container category "${genderCat.name}".`);
        }

        log('Migration completed successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}

run();
