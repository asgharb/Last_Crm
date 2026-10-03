import { listSmsTemplateData } from "@/lib/actions/sms-templates";
import { SmsTemplatesManager } from "./_components/sms-templates-manager";

export default async function SmsTemplatesPage() {
  const { templates, placeholders } = await listSmsTemplateData();
  return (
    <section className="mx-auto max-w-6xl p-5 sm:p-8 lg:p-10">
      <SmsTemplatesManager initialTemplates={templates} placeholders={placeholders} />
    </section>
  );
}
