export async function CreateFinancialAccount(data: {
  name: string;
  type: string;
  initialBalance: number;
  iban?: string;
  note?: string;
}) {
  const res = await fetch("/api/financial-accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to create account");
  }

  return await res.json();
}
