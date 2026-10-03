import {TagsManager} from "./_components/tags-manager";
import {listTags} from "@/lib/actions/tags";

export default async function TagsPage() {
    const tags = await listTags();
    return <section className="mx-auto max-w-5xl p-5 sm:p-8 lg:p-10"><TagsManager initialTags={tags}/></section>;
}
