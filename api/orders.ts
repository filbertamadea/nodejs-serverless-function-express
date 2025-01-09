import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

export default async (req: VercelRequest, res: VercelResponse) => {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Log incoming request headers for debugging
  console.log("Incoming Request Headers:", req.headers);

  // Handle preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    if (req.method === "GET") {
      const { data, error } = await supabase.from("orders").select("*");
      if (error) throw new Error(error.message);

      return res.status(200).json(data);
    }

    if (req.method === "POST") {
      const { tableNumber, orders } = req.body;

      if (!tableNumber || !Array.isArray(orders)) {
        return res
          .status(400)
          .json({ error: "Invalid table number or orders" });
      }

      const { data, error } = await supabase
        .from("orders")
        .upsert([{ table_number: tableNumber, orders }], {
          //@ts-ignore
          onConflict: ["table_number"],
        });

      if (error) throw new Error(error.message);

      return res.status(201).json(data);
    }

    if (req.method === "DELETE") {
      const { tableNumber } = req.query;
      console.log(54, tableNumber);

      if (!tableNumber) {
        return res.status(400).json({ error: "Table number is required" });
      }

      const { error } = await supabase
        .from("orders")
        .delete()
        .eq("table_number", tableNumber);

      if (error) throw new Error(error.message);

      return res
        .status(200)
        .json({ message: `Order for table ${tableNumber} cleared.` });
    }

    // Method not allowed
    res.setHeader("Allow", ["GET", "POST", "DELETE", "OPTIONS"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: (error as Error).message });
  }
};
