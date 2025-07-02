import { DnsScanResult } from "@/types/dns";
import { scanSubdomain } from "@/services/dnsService";
import { useState } from "react";

interface Props {
  result: DnsScanResult;
  onUpdate: (result: DnsScanResult) => void;
}

export default function DomainTable({ result, onUpdate }: Props) {
  const [newSub, setNewSub] = useState("");
  const [refreshing, setRefreshing] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async (subdomain: string) => {
    setRefreshing((prev) => [...prev, subdomain]);
    try {
      // Extract subdomain part without domain
      const subPart = subdomain.replace(`.${result.domain}`, "");
      const updated = await scanSubdomain(result.domain, subPart);

      onUpdate({
        ...result,
        subdomains: result.subdomains.map((s) =>
          s.subdomain === subdomain
            ? {
                ...updated,
                subdomain: subdomain, // Keep original subdomain format
              }
            : s
        ),
      });
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setRefreshing((prev) => prev.filter((s) => s !== subdomain));
    }
  };

 

  const handleAddSubdomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newSub) return;

    // Clean subdomain input
    const cleanSub = newSub.replace(`.${result.domain}`, "").toLowerCase();

    // Check for duplicates
    if (
      result.subdomains.some(
        (sub) =>
          sub.subdomain === cleanSub ||
          sub.subdomain === `${cleanSub}.${result.domain}`
      )
    ) {
      setError("Subdomain already exists");
      return;
    }

    const subInfo = await scanSubdomain(result.domain, cleanSub);
    onUpdate({
      ...result,
      subdomains: [...result.subdomains, subInfo],
    });
    setNewSub("");
  };


  return (
    <div className="space-y-6">
      <form onSubmit={handleAddSubdomain}>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              placeholder="Add new subdomain"
              className="flex-grow px-4 py-2 rounded-lg border border-gray-300 bg-gray-50 focus:bg-white focus:border-gray-500 transition text-gray-800 placeholder-gray-500"
            />
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-800 transition-colors"
            >
              Add
            </button>
          </div>
          {error && (
            <div className="text-red-600 text-sm bg-red-100/70 rounded-lg px-4 py-2">
              {error}
            </div>
          )}
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-3 border-b border-gray-200 text-gray-700">
                Subdomain
              </th>
              <th className="text-left p-3 border-b border-gray-200 text-gray-700">
                DNS IPs
              </th>
              <th className="text-left p-3 border-b border-gray-200 text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {result.subdomains.map((sub) => (
              <tr
                key={sub.subdomain}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="p-3 text-gray-900">{sub.subdomain}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    {sub.dnsIp.length ? (
                      sub.dnsIp.map((ip, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full bg-gray-200 text-gray-800 text-sm"
                        >
                          {ip}
                        </span>
                      ))
                    ) : (
                      <span className="text-red-600 text-sm">No DNS record</span>
                    )}
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRefresh(sub.subdomain)}
                      disabled={refreshing.includes(sub.subdomain)}
                      className={`px-4 py-1.5 rounded-lg text-sm text-white transition-all ${
                        refreshing.includes(sub.subdomain)
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
                      }`}
                    >
                      {refreshing.includes(sub.subdomain)
                        ? "Checking..."
                        : "Refresh"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
