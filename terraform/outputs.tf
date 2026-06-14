output "d1_id" {
  value = cloudflare_d1_database.main.id
}

output "kv_id" {
  value = cloudflare_workers_kv_namespace.cache.id
}