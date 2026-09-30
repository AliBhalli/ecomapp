export async function apiFetch<T=unknown>(url:string, init?:RequestInit):Promise<{ok:true;data:T}|{ok:false;error:string}>{
  const res=await fetch(url,{...init,headers:{"Content-Type":"application/json",...(init?.headers||{})},cache:"no-store"});
  const json=await res.json().catch(()=>({ok:false,error:"Invalid server response."}));
  if(!res.ok||json.ok===false)return {ok:false,error:json.error||"Request failed."};
  return json as {ok:true;data:T};
}