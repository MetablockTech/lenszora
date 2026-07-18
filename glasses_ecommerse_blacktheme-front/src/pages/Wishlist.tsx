import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/hooks/use-cart";
import { motion } from "framer-motion";
import { ShoppingBag, Trash2, Heart, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/utils";

const Wishlist = () => {
    const { wishlistItems, loading, toggleWishlist } = useWishlist();
    const { addToCart } = useCart();

    const handleAddToCart = (product: any) => {
        addToCart({
            productId: product._id,
            title: product.title,
            price: product.price,
            quantity: 1,
            image: product.images[0],
        });
        toast({
            title: "Added to Cart",
            description: `${product.title} has been added to your cart.`,
        });
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="py-12">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-12"
                    >
                        <h1 className="text-4xl font-playfair font-bold text-foreground mb-2">
                            My Wishlist
                        </h1>
                        <p className="text-muted-foreground">
                            Your favorite items saved in one place
                        </p>
                    </motion.div>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-80 bg-slate-800 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : wishlistItems.length === 0 ? (
                        <div className="text-center py-20 border border-dashed border-border/50 rounded-xl bg-card/30">
                            <Heart className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                            <h2 className="text-2xl font-semibold text-foreground mb-2">Your wishlist is empty</h2>
                            <p className="text-muted-foreground mb-8">Start adding items you love to your wishlist!</p>
                            <Link to="/shop" className="btn-gold px-8 py-3">
                                Go to Shop
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {wishlistItems.map((product, index) => (
                                <motion.div
                                    key={product._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="group/card bg-slate-900/40 rounded-xl overflow-hidden border border-slate-800 hover:border-primary/50 transition-all duration-300 h-full flex flex-col cursor-pointer"
                                >
                                    {/* Product Image Area */}
                                    <div className="relative aspect-[4/5] overflow-hidden bg-slate-800">
                                        <button
                                            onClick={() => toggleWishlist(product._id)}
                                            className="absolute top-3 right-3 z-20 w-8 h-8 bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:border-primary hover:text-primary transition-all duration-300 rounded-full"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>

                                        <Link to={`/product/${product._id}`}>
                                            <img
                                                src={getImageUrl(product.images[0])}
                                                alt={product.title}
                                                className="w-full h-full object-cover group-hover/card:scale-110 transition-transform duration-700"
                                            />
                                        </Link>

                                        {product.salePrice && product.price > product.salePrice && (
                                            <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                                                Save {Math.round(((product.price - product.salePrice) / product.price) * 100)}%
                                            </div>
                                        )}
                                        {product.eyewearDetails?.polarized && (
                                            <div className="absolute top-2 left-10 ml-2 bg-primary/90 text-black px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                                                Polarized
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-3 flex-grow flex flex-col">
                                        <Link to={`/product/${product._id}`} className="block">
                                            <h3 className="text-sm font-medium text-white mb-1 line-clamp-1 group-hover/card:text-primary transition-colors">
                                                {product.title}
                                            </h3>
                                        </Link>

                                        {/* Specs Pills */}
                                        <div className="flex flex-wrap gap-x-1.5 gap-y-1 mb-3">
                                            {/* Brand */}
                                            {product.brand && (
                                                <span className="text-[9px] font-bold text-primary border border-primary/30 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                    {typeof product.brand === 'string' ? product.brand : product.brand.name}
                                                </span>
                                            )}

                                            {/* Category */}
                                            {product.category && (
                                                <span className="text-[9px] text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded uppercase font-medium">
                                                    {typeof product.category === 'string' ? product.category : product.category.name}
                                                </span>
                                            )}

                                            {/* Gender/Material/Shape */}
                                            {product.eyewearDetails?.gender && (
                                                <span className="text-[9px] text-slate-400 border border-slate-700/50 px-1.5 py-0.5 rounded">
                                                    {product.eyewearDetails.gender}
                                                </span>
                                            )}
                                            {product.eyewearDetails?.frameMaterial && (
                                                <span className="text-[9px] text-slate-400 border border-slate-700/50 px-1.5 py-0.5 rounded">
                                                    {product.eyewearDetails.frameMaterial}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-auto flex items-center justify-between">
                                            <div className="flex flex-col">
                                                {product.salePrice && product.salePrice < product.price ? (
                                                    <>
                                                        <span className="text-base font-bold text-primary">
                                                            ₹{product.salePrice.toLocaleString()}
                                                        </span>
                                                        <span className="text-xs text-slate-500 line-through">
                                                            ₹{product.price.toLocaleString()}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-base font-bold text-white">
                                                        ₹{product.price.toLocaleString()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleAddToCart(product);
                                                    }}
                                                    className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-gold-500 transition-colors group-hover/card:bg-primary"
                                                >
                                                    <ShoppingBag className="w-4 h-4 text-white group-hover/card:text-black" />
                                                </button>
                                                <Link to={`/product/${product._id}`} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-primary transition-colors">
                                                    <ArrowRight className="w-4 h-4 text-white hover:text-black" />
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Wishlist;
