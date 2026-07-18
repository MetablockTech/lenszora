import { useEffect, useState } from "react";
import { categories, products } from "@/lib/api";
import ProductSlider from "./ProductSlider";

interface Category {
    _id: string;
    name: string;
    slug: string;
    parent?: string;
    children?: Category[];
}

interface Product {
    _id: string;
    title: string;
    slug: string;
    images: string[];
    price: number;
    salePrice?: number;
    category: any;
    brand?: any;
    colors?: string[];
    eyewearDetails?: {
        frameMaterial?: string;
        frameType?: string;
        frameShape?: string;
        glassColor?: string;
        frameColor?: string;
        polarized?: boolean;
        gender?: string;
    };
}

interface CategoryProducts {
    category: Category;
    products: Product[];
}

const CategoryProductSliders = () => {
    const [categoryData, setCategoryData] = useState<CategoryProducts[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCategoryProducts();
    }, []);

    async function fetchCategoryProducts() {
        try {
            const mainCategoriesData = await categories.getMain();
            const mainCategories = Array.isArray(mainCategoriesData) ? mainCategoriesData : [];

            const allCategoriesData = await categories.list();
            const allCategories = Array.isArray(allCategoriesData) ? allCategoriesData : [];

            const allProductsData = await products.list({ limit: 120 });
            const allProducts = Array.isArray(allProductsData) ? allProductsData : [];

            const getAllSubcategoryIds = (mainCatId: string): string[] => {
                const subcatIds = [mainCatId];
                const findChildren = (parentId: string) => {
                    allCategories.forEach((cat: any) => {
                        const catParentId = typeof cat.parentId === 'string' ? cat.parentId : cat.parentId?._id;
                        if (catParentId === parentId && !subcatIds.includes(cat._id)) {
                            subcatIds.push(cat._id);
                            findChildren(cat._id);
                        }
                    });
                };
                findChildren(mainCatId);
                return subcatIds;
            };

            const categoryProductsMap = mainCategories.map((cat: Category) => {
                const subcategoryIds = getAllSubcategoryIds(cat._id);
                const categoryProducts = allProducts
                    .filter((p: Product) => {
                        const productCategoryId = typeof p.category === 'string' ? p.category : p.category?._id;
                        return subcategoryIds.includes(productCategoryId);
                    })
                    .slice(0, 15);

                return {
                    category: cat,
                    products: categoryProducts
                };
            });

            setCategoryData(categoryProductsMap.filter(cp => cp.products.length > 0));
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="py-8 bg-background">
                <div className="container mx-auto px-4">
                    <div className="h-96 bg-slate-800/30 rounded-2xl animate-pulse" />
                </div>
            </div>
        );
    }

    if (categoryData.length === 0) return null;

    return (
        <section className="py-8 bg-background overflow-hidden">
            <div className="container mx-auto px-4 space-y-16">
                {categoryData.map((catData) => (
                    <ProductSlider
                        key={catData.category._id}
                        title={catData.category.name}
                        subtitle={`Explore our collection of ${catData.category.name.toLowerCase()}`}
                        products={catData.products}
                        viewAllLink={`/shop?category=${catData.category._id}`}
                        viewAllText={`View All ${catData.category.name}`}
                    />
                ))}
            </div>
        </section>
    );
};

export default CategoryProductSliders;

