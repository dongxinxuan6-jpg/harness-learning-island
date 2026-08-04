import { ArrowRight, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorPage, LoadingPage, PageHeader } from "../components/PageHeader";
import { dataPaths, type SearchPayload } from "../data/types";
import { useJson } from "../data/useJson";
import { filterSearchResults } from "../search";

const labels = { content: "内容", product: "产品", project: "项目", signal: "技术" };
const route = { content: "content", product: "products", project: "projects", signal: "radar" };

export function SearchPage() {
  const result = useJson<SearchPayload>(dataPaths.search);
  const [query, setQuery] = useState("");
  const matches = useMemo(() => filterSearchResults(result.data?.items ?? [], query), [query, result.data]);
  if (result.loading) return <LoadingPage />;
  if (!result.data) return <ErrorPage message={result.error?.message} />;
  return <div><PageHeader eyebrow="全局搜索" title="搜索产品、内容与技术信号" /><label className="search-field"><Search size={21} /><input aria-label="搜索关键词" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入产品、技术或项目名称" /></label><section className="search-results">{query.trim() && matches.length === 0 ? <p>没有匹配结果</p> : null}{matches.map((item) => <Link key={`${item.type}-${item.slug}`} to={item.type === "signal" ? `/radar#${item.slug}` : `/${route[item.type]}/${item.slug}`}><span>{labels[item.type]}</span><div><h2>{item.title}</h2><p>{item.summary}</p></div><ArrowRight size={17} /></Link>)}</section></div>;
}
