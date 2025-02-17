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

  const handleDelete = (subdomain: string) => {
    onUpdate({
      ...result,
      subdomains: result.subdomains.filter((s) => s.subdomain !== subdomain),
    });
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

  const isMainDomain = (subdomain: string) => {
    return (
      subdomain === result.domain ||
      subdomain.replace(`.${result.domain}`, "") === ""
    );
  };

  return (
    <div>
      <form onSubmit={handleAddSubdomain} className="mb-4">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              placeholder="Add new subdomain"
              className="border p-2 flex-grow"
            />
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Add
            </button>
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </div>
      </form>

      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border p-2">Subdomain</th>
            <th className="border p-2">DNS IPs</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {result.subdomains.map((sub) => (
            <tr key={sub.subdomain}>
              <td className="border p-2">{sub.subdomain}</td>
              <td className="border p-2">
                <div className="flex flex-col gap-1">
                  {sub.dnsIp.length ? (
                    sub.dnsIp.map((ip, i) => (
                      <span
                        key={i}
                        className="bg-gray-100 px-2 py-1 rounded text-sm"
                      >
                        {ip}
                      </span>
                    ))
                  ) : (
                    <span className="text-red-500">No DNS record</span>
                  )}
                </div>
              </td>
              <td className="border p-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRefresh(sub.subdomain)}
                    disabled={refreshing.includes(sub.subdomain)}
                    className={`px-2 py-1 rounded text-sm text-white ${
                      refreshing.includes(sub.subdomain)
                        ? "bg-gray-400"
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    {refreshing.includes(sub.subdomain)
                      ? "Checking..."
                      : "Refresh"}
                  </button>

                  {!isMainDomain(sub.subdomain) && (
                    <button
                      onClick={() => handleDelete(sub.subdomain)}
                      className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
