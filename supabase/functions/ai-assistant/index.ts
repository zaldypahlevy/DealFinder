import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ProductRow {
  id: string;
  name: string;
  brand: string;
  model: string;
  variant: string | null;
  reference_price: number | null;
  description: string | null;
  category: { name: string } | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all active products with their best offer for context
    const { data: products } = await supabase
      .from("products")
      .select("id, name, brand, model, variant, reference_price, description, category:categories(name)")
      .eq("active", true)
      .limit(50);

    const { data: offers } = await supabase
      .from("offers")
      .select("product_id, price, marketplace:marketplaces(name), seller_rating, review_count, warranty, shipping_cost")
      .eq("active", true)
      .order("price", { ascending: true });

    // Build product context with best price
    const productContext: Record<string, { product: ProductRow; bestPrice: number | null; marketplace: string | null }> = {};
    (products as ProductRow[] | null)?.forEach((p) => {
      productContext[p.id] = { product: p, bestPrice: null, marketplace: null };
    });
    (offers as Array<{ product_id: string; price: number; marketplace: { name: string } | null; seller_rating: number; review_count: number; warranty: string | null; shipping_cost: number }> | null)?.forEach((o) => {
      if (productContext[o.product_id] && productContext[o.product_id].bestPrice === null) {
        productContext[o.product_id].bestPrice = Number(o.price);
        productContext[o.product_id].marketplace = o.marketplace?.name || null;
      }
    });

    const productList = Object.values(productContext)
      .filter((item) => item.bestPrice !== null)
      .map((item) => ({
        name: item.product.name,
        brand: item.product.brand,
        category: item.product.category?.name || "Unknown",
        bestPrice: item.bestPrice,
        referencePrice: item.product.reference_price,
        marketplace: item.marketplace,
        description: item.product.description?.substring(0, 100),
      }));

    const systemPrompt = `Anda adalah DealFinder AI, asisten belanja untuk platform DealFinder. Anda membantu pengguna mencari produk, membandingkan harga, dan memutuskan kapan waktu terbaik untuk membeli.

Aturan penting:
1. Hanya gunakan data produk yang diberikan. JANGAN pernah mengarang harga, rating, review, atau ketersediaan.
2. Jawab dalam bahasa Indonesia.
3. Jika produk tidak ada dalam data, katakan dengan jujur.
4. Berikan rekomendasi berdasarkan harga dan nilai, bukan sekadar harga termurah.
5. Sebutkan DF Score konsep: harga yang baik + seller terpercaya + warranty = deal yang baik.
6. Sarankan pengguna untuk melihat halaman produk untuk DF Score dan BUY/WAIT/AVOID lengkap.

Data produk tersedia:
${JSON.stringify(productList, null, 2)}`;

    if (!openaiApiKey) {
      // Fallback: provide a helpful response without AI
      const lowerMsg = message.toLowerCase();
      const matched = productList.filter((p) =>
        lowerMsg.includes(p.name.toLowerCase().split(" ")[0].toLowerCase()) ||
        lowerMsg.includes(p.brand.toLowerCase()) ||
        lowerMsg.includes(p.category.toLowerCase())
      );

      let reply: string;
      if (matched.length > 0) {
        const top = matched.slice(0, 5);
        reply = `Berikut beberapa produk yang relevan dengan pencarian Anda:\n\n`;
        top.forEach((p, i) => {
          reply += `${i + 1}. ${p.name}\n   Harga: Rp${p.bestPrice?.toLocaleString("id-ID")}\n   Marketplace: ${p.marketplace}\n\n`;
        });
        reply += `Klik produk untuk melihat DF Score dan rekomendasi BUY/WAIT/AVOID lengkap.`;
      } else if (lowerMsg.includes("budget") || lowerMsg.includes("juta")) {
        const budgetMatch = message.match(/(\d+)\s*(juta|jt|jutaan)/i);
        if (budgetMatch) {
          const budget = parseInt(budgetMatch[1]) * 1000000;
          const inBudget = productList.filter((p) => p.bestPrice && p.bestPrice <= budget).sort((a, b) => (b.bestPrice || 0) - (a.bestPrice || 0));
          if (inBudget.length > 0) {
            reply = `Produk dalam budget Rp${budget.toLocaleString("id-ID")}:\n\n`;
            inBudget.slice(0, 5).forEach((p, i) => {
              reply += `${i + 1}. ${p.name} - Rp${p.bestPrice?.toLocaleString("id-ID")}\n`;
            });
            reply += `\nLihat halaman produk untuk DF Score dan rekomendasi lengkap.`;
          } else {
            reply = `Maaf, tidak ada produk dalam budget tersebut. Coba tingkatkan budget atau cari kategori lain.`;
          }
        } else {
          reply = `Sebutkan budget spesifik Anda, misalnya "budget Rp15 juta" dan saya akan bantu cari produk yang worth it.`;
        }
      } else {
        reply = `Saya bisa membantu Anda mencari produk, membandingkan harga, dan memutuskan kapan waktu terbaik untuk membeli. Coba tanya: "Laptop apa yang worth it di budget Rp15 juta?" atau sebut nama produk seperti "iPhone 17 Pro".`;
      }

      return new Response(
        JSON.stringify({ reply }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices?.[0]?.message?.content || "Maaf, saya tidak bisa memproses permintaan Anda saat ini.";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
