import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { listCustomers } from "@/lib/actions/customers";
import { listTags } from "@/lib/actions/tags";
import { listActiveSmsTemplates } from "@/lib/actions/sms-send";
import { CustomersTable } from "./_components/customers-table";

export default async function CustomersPage() {
  const [customers, tags, smsTemplates] = await Promise.all([listCustomers(), listTags(), listActiveSmsTemplates()]);
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <section className="mx-auto max-w-8xl p-5 sm:p-8 lg:p-10">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm text-zinc-500">مدیریت سیستم / مشتریان</p>
          <h1 className="text-3xl font-bold tracking-tight">مدیریت مشتریان</h1>
          <p className="mt-2 text-sm text-zinc-400">فهرست و اطلاعات مشتریان ثبت‌شده</p>
        </div>
      </header>
      <CustomersTable initialCustomers={customers} availableTags={tags} smsTemplates={smsTemplates} canManageDocuments={session?.user.role === "admin"} />
    </section>
  );
}
