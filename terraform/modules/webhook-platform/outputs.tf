output "d1_id" {
  value       = cloudflare_d1_database.db.id
  description = "The ID of the D1 database"
}

output "kv_id" {
  value       = cloudflare_workers_kv_namespace.cache.id
  description = "The ID of the KV namespace"
}
