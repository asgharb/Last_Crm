import { listSmsHistory } from "@/lib/actions/sms-history";
import { SmsHistoryTable } from "./_components/sms-history-table";

export default async function SmsHistoryPage() {
  const initialResult = await listSmsHistory({ page: 1, pageSize: 10, query: "", date: "" });
  return (
    <section className="mx-auto max-w-8xl p-5 sm:p-8 lg:p-10">
      <SmsHistoryTable initialResult={initialResult} />
    </section>
  );
}
