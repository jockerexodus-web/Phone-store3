/* ============================================
   Phone Store — Client Supabase
   Waze Studio — 2026/2027
   
   ⚠️ REMPLACEZ les 2 constantes ci-dessous
   par vos vraies valeurs Supabase (Settings > API)
   ============================================ */

const SUPABASE_URL = 'https://VOTRE-PROJET.supabase.co';
const SUPABASE_ANON_KEY = 'VOTRE_CLE_ANON_PUBLIQUE';

let supabaseClient = null;

function initSupabase() {
    if (!window.supabase) {
        console.error('❌ SDK Supabase non chargé');
        return null;
    }
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
        realtime: { params: { eventsPerSecond: 10 } }
    });
    return supabaseClient;
}

// ============ AUTH ============
const SupaAuth = {
    async register({ email, password, name, phone, role }) {
        const { data, error } = await supabaseClient.auth.signUp({
            email, password,
            options: { data: { name, phone, role } }
        });
        if (error) throw error;
        return data;
    },

    async login({ email, password }) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return data;
    },

    async logout() {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
    },

    async getSession() {
        const { data, error } = await supabaseClient.auth.getSession();
        if (error) throw error;
        return data.session;
    },

    async getUser() {
        const { data, error } = await supabaseClient.auth.getUser();
        if (error) throw error;
        return data.user;
    },

    async resetPassword(email) {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin
        });
        if (error) throw error;
    },

    onChange(callback) {
        return supabaseClient.auth.onAuthStateChange((event, session) => callback(event, session));
    }
};

// ============ PROFILES ============
const SupaProfiles = {
    async get(userId) {
        const { data, error } = await supabaseClient
            .from('profiles').select('*').eq('id', userId).single();
        if (error) throw error;
        return data;
    },

    async update(userId, updates) {
        const { data, error } = await supabaseClient
            .from('profiles').update(updates).eq('id', userId).select().single();
        if (error) throw error;
        return data;
    },

    async getMany(ids) {
        const { data, error } = await supabaseClient
            .from('profiles').select('*').in('id', ids);
        if (error) throw error;
        return data || [];
    }
};

// ============ PRODUCTS ============
const SupaProducts = {
    async list({ brand, minPrice, maxPrice, conditions, search, sort } = {}) {
        let query = supabaseClient.from('products')
            .select(`*, seller:profiles!products_seller_id_fkey(id, name, verified, avatar_url)`)
            .eq('is_active', true);

        if (brand) query = query.eq('brand', brand);
        if (minPrice != null) query = query.gte('price', minPrice);
        if (maxPrice != null) query = query.lte('price', maxPrice);
        if (conditions && conditions.length) query = query.in('condition', conditions);
        if (search) query = query.or(`title.ilike.%${search}%,brand.ilike.%${search}%,location.ilike.%${search}%`);

        switch (sort) {
            case 'price-asc': query = query.order('price', { ascending: true }); break;
            case 'price-desc': query = query.order('price', { ascending: false }); break;
            default: query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    async get(id) {
        const { data, error } = await supabaseClient.from('products')
            .select(`*, seller:profiles!products_seller_id_fkey(*)`)
            .eq('id', id).single();
        if (error) throw error;
        return data;
    },

    async mine(userId) {
        const { data, error } = await supabaseClient.from('products')
            .select('*').eq('seller_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async create(product) {
        const { data, error } = await supabaseClient
            .from('products').insert(product).select().single();
        if (error) throw error;
        return data;
    },

    async update(id, updates) {
        const { data, error } = await supabaseClient
            .from('products').update(updates).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },

    async remove(id) {
        const { error } = await supabaseClient.from('products').delete().eq('id', id);
        if (error) throw error;
    }
};

// ============ STORAGE ============
const SupaStorage = {
    async uploadImage(file, userId) {
        if (!file) return null;
        if (file.size > 2 * 1024 * 1024) throw new Error('Image trop lourde (max 2 Mo)');

        const ext = file.name.split('.').pop().toLowerCase();
        const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error } = await supabaseClient.storage
            .from('product-images')
            .upload(fileName, file, { cacheControl: '3600', upsert: false });
        if (error) throw error;

        const { data } = supabaseClient.storage.from('product-images').getPublicUrl(fileName);
        return data.publicUrl;
    },

    async remove(url) {
        if (!url) return;
        try {
            const path = url.split('/product-images/')[1];
            if (path) await supabaseClient.storage.from('product-images').remove([path]);
        } catch (e) { console.warn(e); }
    }
};

// ============ CONVERSATIONS ============
const SupaConversations = {
    async listForUser(userId) {
        const { data, error } = await supabaseClient.from('conversations')
            .select(`
                *,
                buyer:profiles!conversations_buyer_id_fkey(id, name, verified),
                seller:profiles!conversations_seller_id_fkey(id, name, verified),
                product:products(id, title, price, image_url)
            `)
            .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
            .order('last_message_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async findOrCreate({ buyerId, sellerId, productId }) {
        const { data: existing, error: findErr } = await supabaseClient
            .from('conversations').select('*')
            .eq('buyer_id', buyerId)
            .eq('seller_id', sellerId)
            .eq('product_id', productId)
            .maybeSingle();

        if (findErr) throw findErr;
        if (existing) return existing;

        const { data, error } = await supabaseClient.from('conversations')
            .insert({ buyer_id: buyerId, seller_id: sellerId, product_id: productId })
            .select().single();
        if (error) throw error;
        return data;
    }
};

// ============ MESSAGES ============
const SupaMessages = {
    async listForConversation(convId) {
        const { data, error } = await supabaseClient.from('messages')
            .select(`*, sender:profiles!messages_sender_id_fkey(id, name)`)
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async send({ conversationId, senderId, content }) {
        const { data, error } = await supabaseClient.from('messages')
            .insert({ conversation_id: conversationId, sender_id: senderId, content })
            .select().single();
        if (error) throw error;
        return data;
    },

    async markRead(convId, userId) {
        const { error } = await supabaseClient.from('messages')
            .update({ is_read: true })
            .eq('conversation_id', convId)
            .neq('sender_id', userId)
            .eq('is_read', false);
        if (error) throw error;
    },

    async countUnread(userId) {
        const { data: convs } = await supabaseClient.from('conversations')
            .select('id').or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
        if (!convs || !convs.length) return 0;

        const ids = convs.map(c => c.id);
        const { count, error } = await supabaseClient.from('messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', ids)
            .neq('sender_id', userId)
            .eq('is_read', false);
        if (error) return 0;
        return count || 0;
    },

    subscribeToConversation(convId, onNewMessage) {
        return supabaseClient.channel(`conv-${convId}`)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${convId}` },
                (payload) => onNewMessage(payload.new))
            .subscribe();
    },

    unsubscribe(channel) {
        if (channel) supabaseClient.removeChannel(channel);
    }
};

// ============ FAVORITES ============
const SupaFavorites = {
    async list(userId) {
        const { data, error } = await supabaseClient.from('favorites')
            .select(`*, product:products(*, seller:profiles!products_seller_id_fkey(id, name))`)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    },

    async toggle(userId, productId) {
        const { data: existing } = await supabaseClient.from('favorites')
            .select('id').eq('user_id', userId).eq('product_id', productId).maybeSingle();

        if (existing) {
            await supabaseClient.from('favorites').delete().eq('id', existing.id);
            return false;
        }
        await supabaseClient.from('favorites').insert({ user_id: userId, product_id: productId });
        return true;
    },

    async isFavorite(userId, productId) {
        const { data } = await supabaseClient.from('favorites')
            .select('id').eq('user_id', userId).eq('product_id', productId).maybeSingle();
        return !!data;
    }
};

// ============ NOTIFICATIONS ============
const SupaNotifications = {
    async list(userId) {
        const { data, error } = await supabaseClient.from('notifications')
            .select('*').eq('user_id', userId)
            .order('created_at', { ascending: false }).limit(100);
        if (error) throw error;
        return data || [];
    },

    async create({ userId, type, title, content, link }) {
        const { error } = await supabaseClient.from('notifications')
            .insert({ user_id: userId, type, title, content, link });
        if (error) console.warn('Notif error:', error);
    },

    async markAllRead(userId) {
        await supabaseClient.from('notifications')
            .update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    },

    async countUnread(userId) {
        const { count } = await supabaseClient.from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId).eq('is_read', false);
        return count || 0;
    },

    subscribe(userId, onNew) {
        return supabaseClient.channel(`notifs-${userId}`)
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
                (payload) => onNew(payload.new))
            .subscribe();
    }
};

// ============ ORDERS ============
const SupaOrders = {
    async create({ buyerId, sellerId, productId, amount, fee, total, paymentMethod }) {
        const { data, error } = await supabaseClient.from('orders')
            .insert({
                buyer_id: buyerId,
                seller_id: sellerId,
                product_id: productId,
                amount, fee, total,
                payment_method: paymentMethod,
                status: 'paid'
            }).select().single();
        if (error) throw error;
        return data;
    },

    async listMine(userId) {
        const { data, error } = await supabaseClient.from('orders')
            .select(`*, product:products(id, title, image_url), buyer:profiles!orders_buyer_id_fkey(id, name), seller:profiles!orders_seller_id_fkey(id, name)`)
            .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
    }
};

// ============ EXPORT ============
window.Supa = {
    init: initSupabase,
    get client() { return supabaseClient; },
    auth: SupaAuth,
    profiles: SupaProfiles,
    products: SupaProducts,
    storage: SupaStorage,
    conversations: SupaConversations,
    messages: SupaMessages,
    favorites: SupaFavorites,
    notifications: SupaNotifications,
    orders: SupaOrders
};

console.log('✅ Client Supabase prêt');
