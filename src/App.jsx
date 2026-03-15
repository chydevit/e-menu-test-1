import { useEffect, useMemo, useRef, useState } from "react";
import {
  Coffee,
  ChevronLeft,
  CheckCircle2,
  FileText,
  ReceiptText,
  Search,
  ShoppingCart,
  Info,
  Star,
  Plus,
  Minus,
  X,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { Card } from "./components/ui/card";
import {
  categories as initialCategories,
  drinks as initialDrinks,
} from "./data/mockData";
import { formatKHRFromUSD, formatUSD } from "./lib/currency";
import { loadJson, saveJson } from "./lib/storage";
import { categoryLabel, t } from "./lib/i18n";

const STORAGE_KEY = "e_menu_drink:data:v1";
const LANG_KEY = "e_menu_drink:lang:v1";
const RECEIPT_NO_KEY = "e_menu_drink:receipt_no:v1";

const ADMIN_USER = import.meta.env.VITE_ADMIN_USER ?? "admin";
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS ?? "admin123";
const USER_USER = import.meta.env.VITE_USER_USER ?? "user";
const USER_PASS = import.meta.env.VITE_USER_PASS ?? "user123";

function FieldLabel({ children }) {
  return (
    <div className="text-xs font-extrabold tracking-wide text-gray-600">
      {children}
    </div>
  );
}

function SmartImage({ src, alt, className, imgClassName, loading = "lazy" }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative ${className ?? ""}`}>
      {!loaded && !error && (
        <div className="absolute inset-0 z-10 animate-pulse rounded-2xl bg-gray-100" />
      )}
      {error ? (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-gray-100 text-xs font-semibold text-gray-500">
          No image
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`h-full w-full transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"} ${
            imgClassName ?? ""
          }`}
        />
      )}
    </div>
  );
}

function App() {
  const MotionDiv = motion.div;
  const MotionAside = motion.aside;
  const spicyLevels = ["L0", "L0.5", "L1", "L2", "L3", "L4", "L5", "L6", "L7"];
  const sugarLevels = ["0%", "25%", "50%", "75%", "100%"];

  const [lang, setLang] = useState(() => {
    try {
      return window.localStorage.getItem(LANG_KEY) || "en";
    } catch {
      return "en";
    }
  });

  const memoPresets =
    lang === "km"
      ? ["មិនដាក់កក", "ស្ករតិច", "ស្ករច្រើន", "ក្តៅ", "ត្រជាក់", "យកទៅ"]
      : ["No ice", "Less sugar", "Extra sugar", "Hot", "Cold", "Take away"];

  const [drinksData, setDrinksData] = useState(() => {
    const saved = loadJson(STORAGE_KEY, null);
    if (saved?.drinks && Array.isArray(saved.drinks)) return saved.drinks;
    return initialDrinks;
  });
  const [categoriesData, setCategoriesData] = useState(() => {
    const saved = loadJson(STORAGE_KEY, null);
    if (saved?.categories && Array.isArray(saved.categories))
      return saved.categories;
    return initialCategories;
  });

  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [detailDrink, setDetailDrink] = useState(null);
  const [detailSpicyLevel, setDetailSpicyLevel] = useState("");
  const [detailSugarLevel, setDetailSugarLevel] = useState("");
  const [detailMemo, setDetailMemo] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [successSnapshot, setSuccessSnapshot] = useState(null);
  const receiptNoRef = useRef(0);
  const [cartItems, setCartItems] = useState(() => new Map());
  const [orderMessage, setOrderMessage] = useState("");

  const [userAuthed, setUserAuthed] = useState(() => {
    try {
      return window.sessionStorage.getItem("e_menu_user:authed") === "1";
    } catch {
      return false;
    }
  });
  const [userName, setUserName] = useState(() => {
    try {
      return window.sessionStorage.getItem("e_menu_user:username") || "";
    } catch {
      return "";
    }
  });
  const [userLoginOpen, setUserLoginOpen] = useState(false);
  const [userUsername, setUserUsername] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userError, setUserError] = useState("");

  const [adminOpen, setAdminOpen] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState(() => {
    try {
      return window.sessionStorage.getItem("e_menu_admin:authed") === "1";
    } catch {
      return false;
    }
  });
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [editingDrink, setEditingDrink] = useState(null);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    saveJson(STORAGE_KEY, { drinks: drinksData, categories: categoriesData });
  }, [drinksData, categoriesData]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LANG_KEY, lang);
    } catch {
      // ignore
    }
    try {
      document.documentElement.lang = lang === "km" ? "km" : "en";
    } catch {
      // ignore
    }
  }, [lang]);

  useEffect(() => {
    if (!cartOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setCartOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cartOpen]);

  useEffect(() => {
    const modalOpen =
      !!detailDrink ||
      cartOpen ||
      successOpen ||
      userLoginOpen ||
      adminLoginOpen ||
      adminOpen;
    if (!modalOpen) return;

    const prevOverflow = document.body.style.overflow;
    const prevTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.touchAction = prevTouchAction;
    };
  }, [
    adminLoginOpen,
    adminOpen,
    cartOpen,
    detailDrink,
    successOpen,
    userLoginOpen,
  ]);

  useEffect(() => {
    if (!orderMessage) return;
    const timeoutId = window.setTimeout(() => setOrderMessage(""), 4500);
    return () => window.clearTimeout(timeoutId);
  }, [orderMessage]);

  const filteredDrinks = useMemo(() => {
    return drinksData.filter((drink) => {
      const matchesCategory =
        activeCategory === "All" || drink.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        q.length === 0 ||
        drink.name.toLowerCase().includes(q) ||
        (drink.nameKm ?? "").toLowerCase().includes(q) ||
        (drink.description ?? "").toLowerCase().includes(q) ||
        (drink.descriptionKm ?? "").toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, drinksData, searchQuery]);

  const cartSummary = useMemo(() => {
    let count = 0;
    let total = 0;
    for (const item of cartItems.values()) {
      count += item.qty;
      total += item.qty * item.price;
    }
    return { count, total };
  }, [cartItems]);

  const drinkById = useMemo(() => {
    return new Map(drinksData.map((d) => [String(d.id), d]));
  }, [drinksData]);

  const addToCart = (drink, options = undefined) => {
    const key = String(drink.id);
    const memo = String(options?.memo ?? "").trim();
    const spicyLevel = String(options?.spicyLevel ?? "").trim();
    const sugarLevel = String(options?.sugarLevel ?? "").trim();
    const noteParts = [];
    if (spicyLevel) noteParts.push(`${t(lang, "level_spicy")}: ${spicyLevel}`);
    if (sugarLevel) noteParts.push(`${t(lang, "level_sugar")}: ${sugarLevel}`);
    if (memo) noteParts.push(memo);
    const note = noteParts.filter(Boolean).join(" • ");
    setCartItems((prev) => {
      const next = new Map(prev);
      const existing = next.get(key);
      if (existing)
        next.set(key, {
          ...existing,
          qty: existing.qty + 1,
          note: note || existing.note || "",
          spicyLevel: spicyLevel || existing.spicyLevel || "",
          sugarLevel: sugarLevel || existing.sugarLevel || "",
        });
      else
        next.set(key, {
          key,
          drinkId: drink.id,
          name: drink.name,
          price: drink.price,
          image: drink.image,
          rating: drink.rating ?? 0,
          qty: 1,
          note,
          spicyLevel,
          sugarLevel,
        });
      return next;
    });
    setOrderMessage("");
  };

  const openDrinkDetail = (drink) => {
    setDetailDrink(drink);
    setDetailSpicyLevel("");
    setDetailSugarLevel("");
    setDetailMemo("");
  };

  const closeDrinkDetail = () => {
    setDetailDrink(null);
    setDetailSpicyLevel("");
    setDetailSugarLevel("");
    setDetailMemo("");
  };

  const closeSuccess = () => {
    setSuccessOpen(false);
    setSuccessSnapshot(null);
  };

  const decrementCartItem = (key) => {
    setCartItems((prev) => {
      const next = new Map(prev);
      const existing = next.get(key);
      if (!existing) return prev;
      if (existing.qty <= 1) next.delete(key);
      else next.set(key, { ...existing, qty: existing.qty - 1 });
      return next;
    });
  };

  const incrementCartItem = (key) => {
    setCartItems((prev) => {
      const next = new Map(prev);
      const existing = next.get(key);
      if (!existing) return prev;
      next.set(key, { ...existing, qty: existing.qty + 1 });
      return next;
    });
  };

  const removeCartItem = (key) => {
    setCartItems((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  };

  const checkout = () => {
    if (cartItems.size === 0) return;
    if (!userAuthed) {
      setUserError("");
      setUserLoginOpen(true);
      return;
    }
    const snapshot = createReceiptSnapshot();
    setOrderMessage(t(lang, "order_placed"));
    setSuccessSnapshot(snapshot);
    setSuccessOpen(true);
    setCartItems(new Map());
    setCartOpen(false);
  };

  const nextReceiptNo = () => {
    try {
      const current = Number(
        window.localStorage.getItem(RECEIPT_NO_KEY) ?? "0",
      );
      const next = Number.isFinite(current) ? current + 1 : 1;
      window.localStorage.setItem(RECEIPT_NO_KEY, String(next));
      return String(next).padStart(3, "0");
    } catch {
      receiptNoRef.current += 1;
      return String(receiptNoRef.current).padStart(3, "0");
    }
  };

  const createReceiptSnapshot = () => {
    const now = new Date();
    const receiptNo = nextReceiptNo();
    const receiptId = `EM${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
      now.getDate(),
    ).padStart(2, "0")}/${receiptNo}`;
    const items = Array.from(cartItems.values()).map((item) => {
      const drink = drinkById.get(String(item.drinkId));
      const name = drink ? drinkName(drink) : item.name;
      const lineTotal = item.price * item.qty;
      return { ...item, name, lineTotal };
    });

    return {
      now,
      receiptNo,
      receiptId,
      items,
      total: cartSummary.total,
      userName: userAuthed ? userName : "",
    };
  };

  const openReceiptPrint = (snapshot) => {
    if (!snapshot || !snapshot.items || snapshot.items.length === 0) return;

    const now = snapshot.now ?? new Date();
    const receiptNo = String(snapshot.receiptNo ?? "").trim() || "000";
    const receiptId =
      String(snapshot.receiptId ?? "").trim() || `EM/${receiptNo}`;
    const customerName = snapshot.userName
      ? String(snapshot.userName)
      : "General Customer";

    const safeTitle = `${t(lang, "receipt")} - ${receiptNo}`
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
    const safeCustomer = customerName
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

    const html = `<!doctype html>
	<html lang="${lang === "km" ? "km" : "en"}">
	  <head>
	    <meta charset="utf-8" />
	    <meta name="viewport" content="width=device-width, initial-scale=1" />
	    <title>${safeTitle}</title>
	    <style>
	      :root { color-scheme: light; }
	      * { box-sizing: border-box; }
	      body {
	        margin: 0;
	        padding: 12px;
	        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
	        color: #111827;
	        background: #fff;
	      }
	      .wrap { max-width: 420px; margin: 0 auto; }
	      .muted { color: #6b7280; }
	      .row { display: flex; justify-content: space-between; gap: 12px; }
	      .center { text-align: center; }
	      .shop { font-size: 26px; font-weight: 900; letter-spacing: 1px; }
	      .sub { font-size: 12px; font-weight: 700; letter-spacing: 0.4px; margin-top: 2px; }
	      .receipt-no { font-size: 40px; font-weight: 900; letter-spacing: 2px; margin: 10px 0 6px; }
	      .sep { border-top: 1px dashed #111827; margin: 10px 0; opacity: 0.65; }
	      .kv { font-size: 12px; }
	      .kv .k { font-weight: 700; }
	      .kv .v { text-align: right; }
	      .hdr { font-size: 12px; font-weight: 800; }
	      .line { font-size: 12px; display: flex; justify-content: space-between; gap: 10px; }
	      .line .l { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	      .line .r { flex: 0 0 auto; font-weight: 800; }
	      .note { font-size: 11px; color: #374151; margin-left: 14px; }
	      .tot { font-size: 14px; font-weight: 900; }
	      .thanks { margin-top: 10px; font-size: 12px; font-weight: 800; }
	      @media print { body { padding: 0; } }
	    </style>
	  </head>
	  <body>
	    <div class="wrap">
	      <div class="center">
	        <div class="shop">${t(lang, "shop_name")}</div>
	        <div class="sub">Coffee &amp; Bubble Tea</div>
	        <div class="sub">Siem Reap</div>
	        <div class="receipt-no">${receiptNo}</div>
	      </div>
	
	      <div class="kv">
	        <div class="row"><div class="k">${t(lang, "receipt_id")} :</div><div class="v">${receiptId}</div></div>
	        <div class="row"><div class="k">${t(lang, "date_time")} :</div><div class="v">${now.toLocaleString()}</div></div>
	        <div class="row"><div class="k">${t(lang, "customer")} :</div><div class="v">${safeCustomer}</div></div>
	        <div class="row"><div class="k">${t(lang, "cashier")} :</div><div class="v">e-menu</div></div>
	      </div>
	
	      <div class="sep"></div>
	      <div class="row hdr">
	        <div>${t(lang, "qty")}</div>
	        <div style="flex:1 1 auto; text-align:left; margin-left: 10px;">${t(lang, "item_name")}</div>
	        <div>${t(lang, "price")}</div>
	      </div>
	      <div class="sep" style="margin-top:6px;"></div>
	
	      ${snapshot.items
          .map((it) => {
            const safeName = String(it.name)
              .replaceAll("&", "&amp;")
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;");
            const safeNote = String(it.note ?? "")
              .trim()
              .replaceAll("&", "&amp;")
              .replaceAll("<", "&lt;")
              .replaceAll(">", "&gt;");
            const noteHtml = safeNote
              ? `<div class="note">* ${safeNote}</div>`
              : "";
            return `<div style="margin: 8px 0;">
	  <div class="line">
	    <div class="r" style="width: 22px;">${it.qty}</div>
	    <div class="l">${safeName}</div>
	    <div class="r">${formatUSD(it.lineTotal)}</div>
	  </div>
	  ${noteHtml}
	</div>`;
          })
          .join("")}
	
	      <div class="sep"></div>
	      <div class="row kv">
	        <div class="k">Item(s) :</div>
	        <div class="v">${snapshot.items.length}</div>
	      </div>
	      <div class="row kv" style="margin-top:6px;">
	        <div class="k">${t(lang, "grand_total")} :</div>
	        <div class="v tot">${formatUSD(snapshot.total)}</div>
	      </div>
	      <div class="row kv">
	        <div class="k">${t(lang, "grand_total")} (Riel) :</div>
	        <div class="v tot">${formatKHRFromUSD(snapshot.total)}</div>
	      </div>
	
	      <div class="center thanks">${t(lang, "thank_you")}</div>
	    </div>
	  </body>
	</html>`;

    try {
      const iframe = document.createElement("iframe");
      iframe.setAttribute("aria-hidden", "true");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.opacity = "0";
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        iframe.remove();
        return;
      }
      doc.open();
      doc.write(html);
      doc.close();

      const win = iframe.contentWindow;
      if (!win) {
        iframe.remove();
        return;
      }

      win.focus();
      window.setTimeout(() => {
        win.print();
        window.setTimeout(() => iframe.remove(), 1000);
      }, 50);
    } catch {
      // ignore
    }
  };

  const openUserLogin = () => {
    if (userAuthed) return;
    setUserError("");
    setUserUsername(userName);
    setUserPassword("");
    setUserLoginOpen(true);
  };

  const userLogout = () => {
    setUserAuthed(false);
    setUserName("");
    try {
      window.sessionStorage.removeItem("e_menu_user:authed");
      window.sessionStorage.removeItem("e_menu_user:username");
    } catch {
      // ignore
    }
  };

  const userLogin = (e) => {
    e.preventDefault();
    setUserError("");
    const username = userUsername.trim();
    if (username === USER_USER && userPassword === USER_PASS) {
      setUserAuthed(true);
      setUserName(username);
      setUserLoginOpen(false);
      setUserPassword("");
      try {
        window.sessionStorage.setItem("e_menu_user:authed", "1");
        window.sessionStorage.setItem("e_menu_user:username", username);
      } catch {
        // ignore
      }
      return;
    }
    setUserError(t(lang, "invalid_user"));
  };

  const openAdmin = () => {
    if (adminAuthed) setAdminOpen(true);
    else setAdminLoginOpen(true);
  };

  const adminLogout = () => {
    setAdminAuthed(false);
    setAdminOpen(false);
    setEditingDrink(null);
    try {
      window.sessionStorage.removeItem("e_menu_admin:authed");
    } catch {
      // ignore
    }
  };

  const adminLogin = (e) => {
    e.preventDefault();
    setAdminError("");
    if (adminUsername.trim() === ADMIN_USER && adminPassword === ADMIN_PASS) {
      setAdminAuthed(true);
      setAdminLoginOpen(false);
      setAdminOpen(true);
      setAdminPassword("");
      try {
        window.sessionStorage.setItem("e_menu_admin:authed", "1");
      } catch {
        // ignore
      }
      return;
    }
    setAdminError(t(lang, "invalid_admin"));
  };

  const saveDrink = () => {
    if (!editingDrink) return;
    const name = editingDrink.name?.trim();
    const category = editingDrink.category?.trim();
    if (!name) return setAdminError(t(lang, "required_name"));
    if (!category) return setAdminError(t(lang, "required_category"));

    const options = {
      spicy: Boolean(editingDrink.options?.spicy),
      sugar: editingDrink.options?.sugar ?? category === "Coffee",
    };

    const priceNum = Number(editingDrink.price);
    if (!Number.isFinite(priceNum) || priceNum < 0)
      return setAdminError(t(lang, "invalid_price"));

    const ratingNum = Number(editingDrink.rating ?? 0);
    const normalizedRating = Number.isFinite(ratingNum)
      ? Math.max(0, Math.min(5, ratingNum))
      : 0;

    setAdminError("");

    setCategoriesData((prev) => {
      if (prev.includes(category)) return prev;
      return [...prev, category];
    });

    setDrinksData((prev) => {
      const next = [...prev];
      if (editingDrink.id) {
        const idx = next.findIndex((d) => d.id === editingDrink.id);
        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            ...editingDrink,
            name,
            category,
            price: priceNum,
            rating: normalizedRating,
            popular: Boolean(editingDrink.popular),
            options,
          };
          return next;
        }
      }

      const maxId = next.reduce((m, d) => Math.max(m, Number(d.id) || 0), 0);
      next.unshift({
        ...editingDrink,
        id: maxId + 1,
        name,
        category,
        price: priceNum,
        rating: normalizedRating,
        popular: Boolean(editingDrink.popular),
        options,
      });
      return next;
    });

    setEditingDrink(null);
  };

  const deleteDrink = (id) => {
    setDrinksData((prev) => prev.filter((d) => d.id !== id));
    setCartItems((prev) => {
      const next = new Map(prev);
      next.delete(String(id));
      return next;
    });
    if (editingDrink?.id === id) setEditingDrink(null);
  };

  const formatT = (key, vars) => {
    let s = t(lang, key);
    const entries = Object.entries(vars ?? {});
    for (const [k, v] of entries) {
      s = s.split(`{${k}}`).join(String(v));
    }
    return s;
  };

  const deleteCategory = (category) => {
    const c = String(category ?? "").trim();
    if (!c || c === "All")
      return setAdminError(t(lang, "cannot_delete_all_category"));

    const remaining = categoriesData.filter((x) => x !== "All" && x !== c);
    if (remaining.length === 0)
      return setAdminError(t(lang, "cannot_delete_last_category"));

    const fallback = remaining[0];
    const affectedCount = drinksData.reduce(
      (n, d) => n + (d.category === c ? 1 : 0),
      0,
    );

    const confirmLines = [
      formatT("confirm_delete_category", { category: categoryLabel(lang, c) }),
      affectedCount > 0
        ? formatT("confirm_delete_category_move", {
            count: affectedCount,
            fallback: categoryLabel(lang, fallback),
          })
        : null,
      t(lang, "confirm_delete_category_undo"),
    ].filter(Boolean);

    if (!window.confirm(confirmLines.join("\n\n"))) return;

    setAdminError("");
    setCategoriesData((prev) => prev.filter((x) => x !== c));
    setDrinksData((prev) =>
      prev.map((d) => (d.category === c ? { ...d, category: fallback } : d)),
    );
    if (activeCategory === c) setActiveCategory("All");
    if (editingDrink?.category === c)
      setEditingDrink((p) => (p ? { ...p, category: fallback } : p));
    setDetailDrink((p) =>
      p && p.category === c ? { ...p, category: fallback } : p,
    );
  };

  const resetData = () => {
    setDrinksData(initialDrinks);
    setCategoriesData(initialCategories);
    setActiveCategory("All");
    setSearchQuery("");
    setCartItems(new Map());
    setEditingDrink(null);
    setOrderMessage(t(lang, "reset_done"));
  };

  const drinkName = (drink) =>
    lang === "km" && drink.nameKm ? drink.nameKm : drink.name;
  const detailSpicyEnabled = Boolean(detailDrink?.options?.spicy);
  const detailSugarEnabled =
    detailDrink?.options?.sugar ??
    (detailDrink?.options == null && detailDrink?.category === "Coffee");

  return (
    <div className="min-h-screen bg-gray-50 noto-sans-khmer">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full">
        <div className="relative overflow-hidden bg-gradient-to-r from-primary to-black">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10" />
          <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3 text-primary-foreground">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                <Coffee className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <div className="text-xs font-semibold opacity-90">
                  {t(lang, "member")}
                </div>
                <div className="text-base font-extrabold tracking-tight">
                  {userAuthed && userName ? userName : t(lang, "general")}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1 rounded-full bg-white/15 p-1 ring-1 ring-white/20">
                <button
                  type="button"
                  onClick={() => setLang("km")}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold sm:px-3 sm:text-xs ${
                    lang === "km"
                      ? "bg-white text-primary"
                      : "text-primary-foreground/90 hover:bg-white/10"
                  }`}
                  aria-label="Switch to Khmer"
                >
                  ខ្មែរ
                </button>
                <button
                  type="button"
                  onClick={() => setLang("en")}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold sm:px-3 sm:text-xs ${
                    lang === "en"
                      ? "bg-white text-primary"
                      : "text-primary-foreground/90 hover:bg-white/10"
                  }`}
                  aria-label="Switch to English"
                >
                  EN
                </button>
              </div>
              {userAuthed ? (
                <Button
                  variant="secondary"
                  className="h-9 rounded-full bg-white/15 px-4 text-sm font-extrabold text-primary-foreground hover:bg-white/20"
                  onClick={userLogout}
                >
                  {t(lang, "logout")}
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="h-9 rounded-full bg-white/15 px-4 text-sm font-extrabold text-primary-foreground hover:bg-white/20"
                  onClick={openUserLogin}
                >
                  {t(lang, "login")}
                </Button>
              )}
              {adminAuthed && (
                <Button
                  variant="secondary"
                  className="h-9 rounded-full bg-white/15 px-4 text-sm font-extrabold text-primary-foreground hover:bg-white/20"
                  onClick={openAdmin}
                >
                  {t(lang, "admin")}
                </Button>
              )}
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative -mr-2 flex h-12 items-center justify-center gap-2 rounded-full bg-white/15 px-4 text-primary-foreground ring-1 ring-white/20 hover:bg-white/20"
                aria-label={`Open cart (${cartSummary.count} items)`}
              >
                <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                <span
                  className="text-2xl font-extrabold tabular-nums"
                  aria-hidden="true"
                >
                  {cartSummary.count}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Search + Categories (reference style) */}
        <div className="border-b bg-white">
          <div className="container mx-auto px-4 py-3 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
              <div className="flex items-center gap-3 sm:flex-none">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <input
                    type="text"
                    placeholder={t(lang, "search_placeholder")}
                    className="h-9 w-full sm:w-56 rounded-md border border-primary/40 bg-white pl-9 pr-3 text-sm font-medium text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  className="hidden flex-none h-9 rounded-md border border-primary/40 bg-white px-3 text-sm font-extrabold text-primary shadow-sm hover:bg-primary/5"
                  onClick={() => setLang((p) => (p === "km" ? "en" : "km"))}
                  aria-label="Toggle language"
                >
                  {lang === "km" ? "EN" : "ខ្មែរ"}
                </button>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar pb-1 sm:pb-0 sm:flex-1">
                {categoriesData.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`flex-none rounded-md border px-4 py-1.5 text-sm font-semibold transition ${
                      activeCategory === category
                        ? "border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-primary/35 bg-white text-primary hover:bg-primary/5"
                    }`}
                  >
                    {categoryLabel(lang, category)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-6 lg:py-8">
        {orderMessage && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
            {orderMessage}
          </div>
        )}
        <div className="mb-4">
          <div className="text-lg font-extrabold tracking-tight text-gray-900">
            {activeCategory === "All"
              ? t(lang, "all_drinks")
              : categoryLabel(lang, activeCategory)}
          </div>
          <div className="text-sm font-semibold text-gray-500">
            {t(lang, "pick_favorite")}
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {t(lang, "showing")}{" "}
            <span className="font-semibold text-gray-900">
              {filteredDrinks.length}
            </span>{" "}
            {t(lang, "drinks")}
          </div>
        </div>

        {/* Drinks Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDrinks.map((drink, idx) => (
            <MotionDiv
              key={drink.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.4 }}
            >
              <Card
                role="button"
                tabIndex={0}
                onClick={() => openDrinkDetail(drink)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openDrinkDetail(drink);
                  }
                }}
                className="h-full overflow-hidden border border-gray-200 bg-white shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <div className="relative aspect-square bg-white p-3 flex items-center justify-center">
                  <SmartImage
                    key={drink.image}
                    src={drink.image}
                    alt={drinkName(drink)}
                    className="h-full w-full"
                    imgClassName="object-contain drop-shadow-sm"
                  />
                  {drink.popular && (
                    <div className="absolute left-3 top-3">
                      <Badge
                        variant="default"
                        className="font-semibold shadow-md gap-1"
                      >
                        <Star className="h-3 w-3 fill-current" />
                        {t(lang, "popular")}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="px-4 pb-4">
                  <div className="mt-1 line-clamp-2 text-sm font-semibold text-gray-900">
                    {drinkName(drink)}
                  </div>
                  <div className="mt-1 text-lg font-bold text-gray-900">
                    {formatUSD(drink.price)}
                  </div>
                </div>
              </Card>
            </MotionDiv>
          ))}
        </div>

        {filteredDrinks.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
              <Info className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {t(lang, "no_drinks_found")}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {t(lang, "no_drinks_desc")}{" "}
              {searchQuery ? `"${searchQuery}"` : ""}
            </p>
            <Button
              variant="outline"
              className="mt-6 font-medium rounded-full"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("All");
              }}
            >
              {t(lang, "clear_filters")}
            </Button>
          </div>
        )}
      </main>

      {/* Drink Detail */}
      <AnimatePresence>
        {detailDrink && (
          <MotionDiv
            className="fixed inset-0 z-[65] flex items-start justify-center overflow-y-auto overscroll-contain px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/40"
              onClick={closeDrinkDetail}
              aria-hidden="true"
            />
            <MotionDiv
              role="dialog"
              aria-label="Drink detail"
              className="relative z-10 my-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))]"
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
            >
              <div className="flex items-center gap-2 px-4 py-3">
                <button
                  type="button"
                  className="rounded-full p-2 text-gray-700 hover:bg-gray-100"
                  onClick={closeDrinkDetail}
                  aria-label={t(lang, "close")}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="text-sm font-extrabold text-gray-900">
                  {t(lang, "details")}
                </div>
              </div>

              <div className="w-full h-28 overflow-hidden bg-white">
                <img
                  src={detailDrink.image}
                  alt={drinkName(detailDrink)}
                  loading="eager"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="border-t px-5 py-4">
                <div className="text-base font-extrabold text-gray-900">
                  {drinkName(detailDrink)}
                </div>
                <div className="mt-0.5 text-2xl font-bold text-gray-900">
                  {formatUSD(detailDrink.price)}
                </div>
              </div>

              <div className="flex-1 overflow-auto overscroll-contain px-5 pb-5 [-webkit-overflow-scrolling:touch]">
                {detailSpicyEnabled && (
                  <div className="rounded-2xl border p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-semibold text-gray-800">
                        {t(lang, "level_spicy")}{" "}
                        <span className="text-red-500">*</span>
                      </div>
                      <div
                        className={`text-sm font-semibold ${
                          detailSpicyLevel ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {detailSpicyLevel
                          ? t(lang, "ready")
                          : t(lang, "choose_1")}
                      </div>
                    </div>
                    <div className="mt-3 space-y-3">
                      {spicyLevels.map((lvl) => (
                        <label
                          key={lvl}
                          className="flex items-center gap-3 text-sm font-medium text-gray-800"
                        >
                          <input
                            type="radio"
                            name="spicy-level"
                            value={lvl}
                            checked={detailSpicyLevel === lvl}
                            onChange={() => setDetailSpicyLevel(lvl)}
                            className="h-4 w-4 accent-primary"
                          />
                          <span>{lvl}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {detailSugarEnabled && (
                  <div className="mt-4 rounded-2xl border p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-semibold text-gray-800">
                        {t(lang, "level_sugar")}{" "}
                        <span className="text-red-500">*</span>
                      </div>
                      <div
                        className={`text-sm font-semibold ${
                          detailSugarLevel ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {detailSugarLevel
                          ? t(lang, "ready")
                          : t(lang, "choose_1")}
                      </div>
                    </div>
                    <div className="mt-3 space-y-3">
                      {sugarLevels.map((lvl) => (
                        <label
                          key={lvl}
                          className="flex items-center gap-3 text-sm font-medium text-gray-800"
                        >
                          <input
                            type="radio"
                            name="sugar-level"
                            value={lvl}
                            checked={detailSugarLevel === lvl}
                            onChange={() => setDetailSugarLevel(lvl)}
                            className="h-4 w-4 accent-primary"
                          />
                          <span>{lvl}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 rounded-2xl border p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span>{t(lang, "memo")}</span>
                  </div>
                  <textarea
                    value={detailMemo}
                    onChange={(e) => setDetailMemo(e.target.value)}
                    rows={3}
                    className="mt-3 w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder=""
                  />
                  <div className="mt-3 flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
                    {memoPresets.map((label) => (
                      <button
                        key={label}
                        type="button"
                        className="flex-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                        onClick={() =>
                          setDetailMemo((prev) => {
                            const next = (prev ?? "").trim();
                            if (!next) return label;
                            if (next.includes(label)) return prev;
                            return `${next} ${label}`;
                          })
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <Button
                  className="w-full rounded-xl font-semibold"
                  disabled={
                    (detailSpicyEnabled && !detailSpicyLevel) ||
                    (detailSugarEnabled && !detailSugarLevel)
                  }
                  onClick={() => {
                    addToCart(detailDrink, {
                      spicyLevel: detailSpicyLevel,
                      sugarLevel: detailSugarLevel,
                      memo: detailMemo,
                    });
                    closeDrinkDetail();
                  }}
                >
                  {t(lang, "add_to_cart")}
                </Button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Receipt Bar */}
      <button
        type="button"
        className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 backdrop-blur-sm shadow-[0_-8px_24px_rgba(0,0,0,0.08)]"
        onClick={() => setCartOpen(true)}
        aria-label="Open receipt"
      >
        <div className="container mx-auto flex items-center justify-center px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-6">
          <div className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary">
            <ReceiptText className="h-4 w-4" />
            <span>
              {t(lang, "receipt")} ({formatUSD(cartSummary.total)})
            </span>
          </div>
        </div>
      </button>

      {/* Cart Modal */}
      <AnimatePresence>
        {cartOpen && (
          <MotionDiv
            className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto overscroll-contain px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setCartOpen(false)}
              aria-hidden="true"
            />
            <MotionDiv
              role="dialog"
              aria-label="Cart"
              className="relative z-10 my-auto flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))]"
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
            >
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <div className="text-lg font-bold text-gray-900">
                    {t(lang, "your_cart")}
                  </div>
                  <div className="text-sm text-gray-500">
                    {cartSummary.count} {t(lang, "items")}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setCartOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-auto overscroll-contain p-5 [-webkit-overflow-scrolling:touch]">
                {cartItems.size === 0 ? (
                  <div className="rounded-2xl border border-dashed p-8 text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <ShoppingCart className="h-6 w-6 text-gray-500" />
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {t(lang, "cart_empty")}
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {t(lang, "cart_empty_help")}
                    </div>
                    <Button
                      className="mt-5 rounded-xl"
                      onClick={() => setCartOpen(false)}
                    >
                      {t(lang, "continue_shopping")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Array.from(cartItems.values()).map((item) => {
                      const drink = drinkById.get(item.key);
                      const displayName = drink ? drinkName(drink) : item.name;
                      const displayImage = drink?.image ?? item.image;

                      return (
                        <div
                          key={item.key}
                          className="flex gap-3 rounded-2xl border p-3"
                        >
                          <div className="h-16 w-16 overflow-hidden rounded-xl bg-gray-100 flex-none p-2 flex items-center justify-center">
                            <SmartImage
                              key={`${item.key}:${displayImage ?? ""}`}
                              src={displayImage}
                              alt={displayName}
                              className="h-full w-full"
                              imgClassName="object-contain"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="truncate font-semibold text-gray-900">
                                  {displayName}
                                </div>
                                {item.note ? (
                                  <div className="mt-1 line-clamp-2 text-xs font-medium text-gray-500">
                                    {item.note}
                                  </div>
                                ) : null}
                                <div className="mt-1 text-sm font-bold text-primary">
                                  {formatUSD(item.price * item.qty)}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                                onClick={() => removeCartItem(item.key)}
                                aria-label={`Remove ${displayName} from cart`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="mt-3 flex items-center justify-between">
                              <div className="text-xs font-semibold text-gray-500">
                                {formatUSD(item.price)} each
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 rounded-full"
                                  onClick={() => decrementCartItem(item.key)}
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <div className="w-8 text-center text-sm font-bold text-gray-900">
                                  {item.qty}
                                </div>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-9 w-9 rounded-full"
                                  onClick={() => incrementCartItem(item.key)}
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="border-t p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-600">
                    {t(lang, "total")}
                  </div>
                  <div className="text-right leading-tight">
                    <div className="text-lg font-extrabold text-gray-900">
                      {formatUSD(cartSummary.total)}
                    </div>
                    <div className="text-xs font-semibold text-gray-500">
                      {formatKHRFromUSD(cartSummary.total)}
                    </div>
                  </div>
                </div>
                <Button
                  className="mt-3 w-full rounded-xl font-semibold"
                  onClick={checkout}
                  disabled={cartItems.size === 0}
                >
                  {t(lang, "buy_now")}
                </Button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Purchase Success */}
      <AnimatePresence>
        {successOpen && (
          <MotionDiv
            className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto overscroll-contain px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/40"
              onClick={closeSuccess}
              aria-hidden="true"
            />
            <MotionDiv
              role="dialog"
              aria-label="Purchase success"
              className="relative z-10 my-auto w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
            >
              <div className="p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
                  <CheckCircle2 className="h-9 w-9 text-green-600" />
                </div>
                <div className="mt-4 text-xl font-extrabold text-gray-900">
                  {t(lang, "purchase_success")}
                </div>
                <div className="mt-2 text-sm font-semibold text-gray-500">
                  {t(lang, "print_invoice_question")}
                </div>
                {successSnapshot?.total != null && (
                  <div className="mt-3 text-sm font-extrabold text-gray-900">
                    {t(lang, "total")}: {formatUSD(successSnapshot.total)}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 border-t p-4">
                <Button
                  className="h-11 rounded-2xl font-extrabold"
                  onClick={() => {
                    if (successSnapshot) openReceiptPrint(successSnapshot);
                    closeSuccess();
                  }}
                >
                  {t(lang, "print_invoice")}
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-2xl font-extrabold"
                  onClick={closeSuccess}
                >
                  {t(lang, "no_print")}
                </Button>
              </div>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* User Login */}
      <AnimatePresence>
        {userLoginOpen && (
          <MotionDiv
            className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto overscroll-contain px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => {
                setUserLoginOpen(false);
                setUserError("");
              }}
              aria-hidden="true"
            />
            <MotionDiv
              className="relative z-10 my-auto w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              role="dialog"
              aria-label="User login"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-extrabold text-gray-900">
                    {t(lang, "user_login")}
                  </div>
                  {USER_USER === "user" && USER_PASS === "user123" && (
                    <div className="mt-1 text-sm font-semibold text-gray-500">
                      {t(lang, "demo_creds")}:{" "}
                      <span className="font-extrabold">user</span> /{" "}
                      <span className="font-extrabold">user123</span>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={() => {
                    setUserLoginOpen(false);
                    setUserError("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form className="mt-4 space-y-3" onSubmit={userLogin}>
                <div className="space-y-1">
                  <FieldLabel>{t(lang, "username")}</FieldLabel>
                  <input
                    className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={userUsername}
                    onChange={(e) => setUserUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel>{t(lang, "password")}</FieldLabel>
                  <input
                    type="password"
                    className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                {userError && (
                  <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">
                    {userError}
                  </div>
                )}

                <Button
                  className="h-11 w-full rounded-2xl font-extrabold"
                  type="submit"
                >
                  {t(lang, "sign_in")}
                </Button>

                <Button
                  className="h-11 w-full rounded-2xl font-extrabold"
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setUserLoginOpen(false);
                    openAdmin();
                  }}
                >
                  {t(lang, "admin")}
                </Button>
              </form>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Admin Login */}
      <AnimatePresence>
        {adminLoginOpen && (
          <MotionDiv
            className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto overscroll-contain px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setAdminLoginOpen(false)}
              aria-hidden="true"
            />
            <MotionDiv
              className="relative z-10 my-auto w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              role="dialog"
              aria-label="Admin login"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-extrabold text-gray-900">
                    {t(lang, "admin_login")}
                  </div>
                  <div className="mt-1 text-sm font-semibold text-gray-500">
                    {t(lang, "demo_creds")}:{" "}
                    <span className="font-extrabold">admin</span> /{" "}
                    <span className="font-extrabold">admin123</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setAdminLoginOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form className="mt-4 space-y-3" onSubmit={adminLogin}>
                <div className="space-y-1">
                  <FieldLabel>{t(lang, "username")}</FieldLabel>
                  <input
                    className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-1">
                  <FieldLabel>{t(lang, "password")}</FieldLabel>
                  <input
                    type="password"
                    className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                {adminError && (
                  <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">
                    {adminError}
                  </div>
                )}

                <Button
                  className="h-11 w-full rounded-2xl font-extrabold"
                  type="submit"
                >
                  {t(lang, "sign_in")}
                </Button>
              </form>
            </MotionDiv>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* Admin Panel */}
      <AnimatePresence>
        {adminOpen && (
          <MotionDiv
            className="fixed inset-0 z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setAdminOpen(false)}
              aria-hidden="true"
            />
            <MotionAside
              className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl flex flex-col"
              initial={{ x: 520 }}
              animate={{ x: 0 }}
              exit={{ x: 520 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              role="dialog"
              aria-label="Admin panel"
            >
              <div className="flex items-center justify-between border-b p-4">
                <div>
                  <div className="text-lg font-extrabold text-gray-900">
                    {t(lang, "admin_panel")}
                  </div>
                  <div className="text-sm font-semibold text-gray-500">
                    {t(lang, "manage_demo")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={resetData}
                  >
                    {t(lang, "reset")}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={adminLogout}
                  >
                    {t(lang, "logout")}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setAdminOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-4">
                {adminError && (
                  <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-semibold text-gray-900">
                    {adminError}
                  </div>
                )}

                <div className="rounded-3xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-extrabold text-gray-900">
                      {t(lang, "categories")}
                    </div>
                    <div className="text-xs font-semibold text-gray-500">
                      {categoriesData.length} total
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {categoriesData.map((c) => (
                      <span
                        key={c}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-extrabold text-primary"
                      >
                        <span>{categoryLabel(lang, c)}</span>
                        {c !== "All" && (
                          <button
                            type="button"
                            className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-primary hover:bg-primary/10"
                            onClick={() => deleteCategory(c)}
                            aria-label={`${t(lang, "delete")} ${t(lang, "category")}: ${categoryLabel(lang, c)}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      className="h-10 flex-1 rounded-2xl border border-gray-200 bg-white px-3 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder={t(lang, "new_category")}
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                    <Button
                      className="h-10 rounded-2xl font-extrabold"
                      onClick={() => {
                        const c = newCategory.trim();
                        if (!c) return;
                        if (categoriesData.includes(c))
                          return setNewCategory("");
                        setCategoriesData((prev) => [...prev, c]);
                        setNewCategory("");
                      }}
                    >
                      {t(lang, "add")}
                    </Button>
                  </div>
                </div>

                <div className="rounded-3xl border p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-extrabold text-gray-900">
                      {t(lang, "drinks_title")}
                    </div>
                    <Button
                      className="h-10 rounded-2xl font-extrabold"
                      onClick={() => {
                        const defaultCategory =
                          categoriesData.find((c) => c !== "All") ?? "Coffee";
                        setEditingDrink({
                          id: null,
                          name: "",
                          nameKm: "",
                          description: "",
                          descriptionKm: "",
                          price: 0,
                          category: defaultCategory,
                          image: "",
                          popular: false,
                          rating: 0,
                          options: {
                            spicy: false,
                            sugar: defaultCategory === "Coffee",
                          },
                        });
                      }}
                    >
                      {t(lang, "new")}
                    </Button>
                  </div>

                  {editingDrink && (
                    <div className="mt-4 rounded-3xl bg-gray-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-extrabold text-gray-900">
                          {editingDrink.id
                            ? `Edit #${editingDrink.id}`
                            : "Create Drink"}
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="rounded-full"
                          onClick={() => setEditingDrink(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1 sm:col-span-2">
                          <FieldLabel>{t(lang, "name")}</FieldLabel>
                          <input
                            className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={editingDrink.name}
                            onChange={(e) =>
                              setEditingDrink((p) => ({
                                ...p,
                                name: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <FieldLabel>{t(lang, "name_km")}</FieldLabel>
                          <input
                            className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={editingDrink.nameKm ?? ""}
                            onChange={(e) =>
                              setEditingDrink((p) => ({
                                ...p,
                                nameKm: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <FieldLabel>{t(lang, "price")}</FieldLabel>
                          <input
                            type="number"
                            step="0.01"
                            className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={editingDrink.price}
                            onChange={(e) =>
                              setEditingDrink((p) => ({
                                ...p,
                                price: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <FieldLabel>{t(lang, "rating_0_5")}</FieldLabel>
                          <input
                            type="number"
                            step="0.1"
                            className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={editingDrink.rating ?? 0}
                            onChange={(e) =>
                              setEditingDrink((p) => ({
                                ...p,
                                rating: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <FieldLabel>{t(lang, "category")}</FieldLabel>
                          <input
                            className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={editingDrink.category}
                            onChange={(e) =>
                              setEditingDrink((p) => ({
                                ...p,
                                category: e.target.value,
                              }))
                            }
                            list="category-list"
                          />
                          <datalist id="category-list">
                            {categoriesData
                              .filter((c) => c !== "All")
                              .map((c) => (
                                <option key={c} value={c} />
                              ))}
                          </datalist>
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <FieldLabel>{t(lang, "image_url")}</FieldLabel>
                          <input
                            className="h-11 w-full rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={editingDrink.image}
                            onChange={(e) =>
                              setEditingDrink((p) => ({
                                ...p,
                                image: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <FieldLabel>{t(lang, "description")}</FieldLabel>
                          <textarea
                            rows={3}
                            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={editingDrink.description}
                            onChange={(e) =>
                              setEditingDrink((p) => ({
                                ...p,
                                description: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <FieldLabel>{t(lang, "description_km")}</FieldLabel>
                          <textarea
                            rows={3}
                            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            value={editingDrink.descriptionKm ?? ""}
                            onChange={(e) =>
                              setEditingDrink((p) => ({
                                ...p,
                                descriptionKm: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-gray-900"
                            checked={Boolean(editingDrink.popular)}
                            onChange={(e) =>
                              setEditingDrink((p) => ({
                                ...p,
                                popular: e.target.checked,
                              }))
                            }
                          />
                          {t(lang, "popular")}
                        </label>

                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-gray-900"
                            checked={Boolean(editingDrink.options?.spicy)}
                            onChange={(e) =>
                              setEditingDrink((p) => ({
                                ...p,
                                options: {
                                  ...(p.options ?? {}),
                                  spicy: e.target.checked,
                                },
                              }))
                            }
                          />
                          {t(lang, "enable_spicy")}
                        </label>

                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-gray-900"
                            checked={
                              Boolean(editingDrink.options?.sugar) ||
                              (!editingDrink.options &&
                                editingDrink.category === "Coffee")
                            }
                            onChange={(e) =>
                              setEditingDrink((p) => ({
                                ...p,
                                options: {
                                  ...(p.options ?? {}),
                                  sugar: e.target.checked,
                                },
                              }))
                            }
                          />
                          {t(lang, "enable_sugar")}
                        </label>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          className="h-11 flex-1 rounded-2xl font-extrabold"
                          onClick={saveDrink}
                        >
                          {t(lang, "save")}
                        </Button>
                        <Button
                          variant="outline"
                          className="h-11 rounded-2xl font-extrabold"
                          onClick={() => {
                            setEditingDrink(null);
                            setAdminError("");
                          }}
                        >
                          {t(lang, "cancel")}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 space-y-2">
                    {drinksData.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-3 rounded-2xl border p-3"
                      >
                        <div className="h-12 w-12 overflow-hidden rounded-xl bg-gray-100 flex-none">
                          {d.image ? (
                            <img
                              src={d.image}
                              alt={d.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs font-extrabold text-gray-400">
                              IMG
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-extrabold text-gray-900">
                            {d.name}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-xs font-semibold text-gray-500">
                            <span className="rounded-full bg-primary/5 px-2 py-0.5 text-primary">
                              {d.category}
                            </span>
                            <span>
                              {formatUSD(d.price)}{" "}
                              <span className="text-xs font-semibold text-gray-500">
                                ({formatKHRFromUSD(d.price)})
                              </span>
                            </span>
                            {d.popular && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-900">
                                {t(lang, "popular")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            className="h-9 rounded-full px-4 text-sm font-extrabold"
                            onClick={() => {
                              setAdminError("");
                              setEditingDrink({
                                id: d.id,
                                name: d.name,
                                nameKm: d.nameKm ?? "",
                                description: d.description ?? "",
                                descriptionKm: d.descriptionKm ?? "",
                                price: d.price,
                                category: d.category,
                                image: d.image ?? "",
                                popular: Boolean(d.popular),
                                rating: d.rating ?? 0,
                                options: {
                                  spicy: Boolean(d.options?.spicy),
                                  sugar:
                                    d.options?.sugar ?? d.category === "Coffee",
                                },
                              });
                            }}
                          >
                            {t(lang, "edit")}
                          </Button>
                          <Button
                            variant="outline"
                            className="h-9 rounded-full px-4 text-sm font-extrabold text-gray-900 hover:text-gray-900"
                            onClick={() => deleteDrink(d.id)}
                          >
                            {t(lang, "delete")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </MotionAside>
          </MotionDiv>
        )}
      </AnimatePresence>

      {/* CSS for hiding scrollbar in categories */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `,
        }}
      />
    </div>
  );
}

export default App;
