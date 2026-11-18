// Runs automatically every time someone submits a Netlify form on this site.
// Sends a WhatsApp message about the new RSVP through the CallMeBot API.
// Needs two environment variables set in Netlify:
//   CALLMEBOT_PHONE   your WhatsApp number with country code, e.g. +27731234567
//   CALLMEBOT_APIKEY  the API key the CallMeBot bot sent you on WhatsApp

export default async (req) => {
  const phone = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!phone || !apikey) {
    console.log("WhatsApp alert skipped: CALLMEBOT_PHONE or CALLMEBOT_APIKEY not set");
    return new Response("not configured", { status: 200 });
  }

  let data = {};
  let formName = "";
  try {
    const body = await req.json();
    data = body?.payload?.data || {};
    formName = body?.payload?.form_name || "";
  } catch (e) {
    console.log("Could not read submission", e);
  }
  if (formName && formName !== "rsvp") return new Response("ignored", { status: 200 });

  const clean = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
  const lines = [
    "Umgidi RSVP!",
    "Name: " + (clean(data.name, 60) || "-"),
    "People: " + (clean(data.people, 5) || "1"),
  ];
  if (clean(data.phone, 20)) lines.push("Phone: " + clean(data.phone, 20));
  if (clean(data.message, 300)) lines.push("Message: " + clean(data.message, 300));

  const url = "https://api.callmebot.com/whatsapp.php?phone=" + encodeURIComponent(phone)
    + "&text=" + encodeURIComponent(lines.join("\n"))
    + "&apikey=" + encodeURIComponent(apikey);

  try {
    const res = await fetch(url);
    console.log("CallMeBot status", res.status);
  } catch (e) {
    console.log("CallMeBot request failed", e);
  }
  return new Response("ok", { status: 200 });
};
