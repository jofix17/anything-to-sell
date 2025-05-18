# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2025_05_09_130946) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pgcrypto"
  enable_extension "plpgsql"

  create_table "addresses", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id"
    t.string "address_line1", null: false
    t.string "address_line2"
    t.string "city", null: false
    t.string "state", null: false
    t.string "zipcode", null: false
    t.string "country", null: false
    t.boolean "is_default", default: false
    t.integer "address_type", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_addresses_on_user_id"
  end

  create_table "cart_items", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "cart_id", null: false
    t.uuid "product_id", null: false
    t.uuid "product_variant_id"
    t.integer "quantity", default: 1, null: false
    t.decimal "price", precision: 10, scale: 2, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["cart_id", "product_id", "product_variant_id"], name: "index_cart_items_on_cart_product_and_variant", unique: true
    t.index ["cart_id"], name: "index_cart_items_on_cart_id"
    t.index ["product_id"], name: "index_cart_items_on_product_id"
    t.index ["product_variant_id"], name: "index_cart_items_on_product_variant_id"
  end

  create_table "carts", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id"
    t.string "guest_token"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["guest_token"], name: "index_carts_on_guest_token", unique: true
    t.index ["user_id"], name: "index_carts_on_user_id"
  end

  create_table "categories", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.text "description"
    t.string "slug", null: false
    t.uuid "parent_id"
    t.string "image_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_categories_on_name"
    t.index ["parent_id"], name: "index_categories_on_parent_id"
    t.index ["slug"], name: "index_categories_on_slug", unique: true
  end

  create_table "category_properties", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "category_id", null: false
    t.uuid "property_definition_id", null: false
    t.boolean "is_required", default: false
    t.integer "display_order", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id", "property_definition_id"], name: "idx_on_category_id_property_definition_id_ad40ba582e", unique: true
    t.index ["category_id"], name: "index_category_properties_on_category_id"
    t.index ["property_definition_id"], name: "index_category_properties_on_property_definition_id"
  end

  create_table "collection_products", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "collection_id", null: false
    t.uuid "product_id", null: false
    t.integer "position", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["collection_id"], name: "index_collection_products_on_collection_id"
    t.index ["position"], name: "index_collection_products_on_position"
    t.index ["product_id", "collection_id"], name: "index_collection_products_on_product_id_and_collection_id", unique: true
    t.index ["product_id"], name: "index_collection_products_on_product_id"
  end

  create_table "collections", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "slug", null: false
    t.text "description"
    t.boolean "is_active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_collections_on_slug", unique: true
  end

  create_table "discount_code_usages", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.uuid "discount_code_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["discount_code_id"], name: "index_discount_code_usages_on_discount_code_id"
    t.index ["user_id"], name: "index_discount_code_usages_on_user_id"
  end

  create_table "discount_codes", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "code", null: false
    t.integer "discount_type", null: false
    t.decimal "discount_value", precision: 10, scale: 2, null: false
    t.decimal "min_purchase", precision: 10, scale: 2
    t.datetime "expires_at"
    t.integer "status", default: 0, null: false
    t.uuid "user_id"
    t.uuid "product_id"
    t.uuid "category_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id"], name: "index_discount_codes_on_category_id"
    t.index ["product_id"], name: "index_discount_codes_on_product_id"
    t.index ["user_id"], name: "index_discount_codes_on_user_id"
  end

  create_table "helpful_marks", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.uuid "review_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["review_id"], name: "index_helpful_marks_on_review_id"
    t.index ["user_id", "review_id"], name: "index_helpful_marks_on_user_id_and_review_id", unique: true
    t.index ["user_id"], name: "index_helpful_marks_on_user_id"
  end

  create_table "order_histories", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "order_id", null: false
    t.integer "status", default: 2
    t.string "note"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["order_id"], name: "index_order_histories_on_order_id"
  end

  create_table "order_items", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "order_id", null: false
    t.uuid "product_id", null: false
    t.integer "quantity", default: 1, null: false
    t.decimal "price", precision: 10, scale: 2, null: false
    t.decimal "total", precision: 10, scale: 2, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["order_id", "product_id"], name: "index_order_items_on_order_id_and_product_id", unique: true
    t.index ["order_id"], name: "index_order_items_on_order_id"
    t.index ["product_id"], name: "index_order_items_on_product_id"
  end

  create_table "orders", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "order_number", null: false
    t.uuid "user_id", null: false
    t.uuid "shipping_address_id"
    t.uuid "billing_address_id"
    t.integer "status", default: 0, null: false
    t.integer "payment_method", default: 0, null: false
    t.datetime "payment_date"
    t.integer "payment_status", default: 0, null: false
    t.decimal "shipping_cost", precision: 10, scale: 2, default: "0.0"
    t.decimal "tax_amount", precision: 10, scale: 2, default: "0.0"
    t.decimal "subtotal_amount", precision: 10, scale: 2, default: "0.0"
    t.decimal "total_amount", precision: 10, scale: 2, default: "0.0"
    t.text "notes"
    t.string "tracking_number"
    t.string "tracking_url"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["billing_address_id"], name: "index_orders_on_billing_address_id"
    t.index ["order_number"], name: "index_orders_on_order_number", unique: true
    t.index ["payment_status"], name: "index_orders_on_payment_status"
    t.index ["shipping_address_id"], name: "index_orders_on_shipping_address_id"
    t.index ["status"], name: "index_orders_on_status"
    t.index ["user_id"], name: "index_orders_on_user_id"
  end

  create_table "product_images", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "product_id", null: false
    t.string "image_url", null: false
    t.boolean "is_primary", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id", "is_primary"], name: "index_product_images_on_product_id_and_is_primary", unique: true, where: "(is_primary = true)"
    t.index ["product_id"], name: "index_product_images_on_product_id"
  end

  create_table "product_property_values", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "product_id", null: false
    t.uuid "property_definition_id", null: false
    t.string "value_string"
    t.decimal "value_decimal", precision: 15, scale: 5
    t.boolean "value_boolean"
    t.jsonb "value_json"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id", "property_definition_id"], name: "idx_on_product_id_property_definition_id_c4b30c8ed6", unique: true
    t.index ["product_id"], name: "index_product_property_values_on_product_id"
    t.index ["property_definition_id"], name: "index_product_property_values_on_property_definition_id"
  end

  create_table "product_variants", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "product_id", null: false
    t.string "sku", null: false
    t.decimal "price", precision: 10, scale: 2
    t.decimal "sale_price", precision: 10, scale: 2
    t.integer "inventory", default: 0
    t.jsonb "properties", default: {}
    t.boolean "is_default", default: false
    t.boolean "is_active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id", "is_default"], name: "index_product_variants_on_product_id_and_is_default", unique: true, where: "(is_default = true)"
    t.index ["product_id"], name: "index_product_variants_on_product_id"
    t.index ["sku"], name: "index_product_variants_on_sku", unique: true
  end

  create_table "products", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "sku"
    t.string "name", null: false
    t.text "description"
    t.decimal "price", precision: 10, scale: 2, null: false
    t.decimal "sale_price", precision: 10, scale: 2
    t.uuid "category_id", null: false
    t.uuid "user_id", null: false
    t.integer "inventory", default: 0
    t.boolean "is_active", default: false
    t.integer "status", default: 0
    t.text "rejection_reason"
    t.boolean "has_variants", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category_id"], name: "index_products_on_category_id"
    t.index ["name"], name: "index_products_on_name"
    t.index ["sku"], name: "index_products_on_sku"
    t.index ["status"], name: "index_products_on_status"
    t.index ["user_id"], name: "index_products_on_user_id"
  end

  create_table "property_definitions", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "display_name", null: false
    t.string "property_type", null: false
    t.boolean "is_variant", default: false
    t.boolean "is_required", default: false
    t.jsonb "config", default: {}
    t.integer "display_order", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["is_variant"], name: "index_property_definitions_on_is_variant"
    t.index ["name"], name: "index_property_definitions_on_name"
    t.index ["property_type"], name: "index_property_definitions_on_property_type"
  end

  create_table "reviews", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "product_id", null: false
    t.uuid "user_id", null: false
    t.integer "rating", null: false
    t.text "comment", null: false
    t.integer "status", default: 0
    t.integer "helpful_count", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id", "status", "rating"], name: "index_reviews_on_product_id_and_status_and_rating"
    t.index ["product_id"], name: "index_reviews_on_product_id"
    t.index ["user_id", "product_id"], name: "index_reviews_on_user_id_and_product_id", unique: true
    t.index ["user_id"], name: "index_reviews_on_user_id"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "email"
    t.string "password_digest"
    t.string "first_name"
    t.string "last_name"
    t.integer "role", default: 0
    t.string "phone"
    t.string "avatar_url"
    t.integer "status", default: 2
    t.datetime "last_login_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email"
  end

  create_table "wishlist_items", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.uuid "product_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["product_id"], name: "index_wishlist_items_on_product_id"
    t.index ["user_id"], name: "index_wishlist_items_on_user_id"
  end

  add_foreign_key "addresses", "users"
  add_foreign_key "cart_items", "carts"
  add_foreign_key "cart_items", "products"
  add_foreign_key "carts", "users"
  add_foreign_key "categories", "categories", column: "parent_id"
  add_foreign_key "category_properties", "categories"
  add_foreign_key "category_properties", "property_definitions"
  add_foreign_key "collection_products", "collections"
  add_foreign_key "collection_products", "products"
  add_foreign_key "discount_code_usages", "discount_codes"
  add_foreign_key "discount_code_usages", "users"
  add_foreign_key "discount_codes", "categories"
  add_foreign_key "discount_codes", "products"
  add_foreign_key "discount_codes", "users"
  add_foreign_key "helpful_marks", "reviews"
  add_foreign_key "helpful_marks", "users"
  add_foreign_key "order_histories", "orders"
  add_foreign_key "order_items", "orders"
  add_foreign_key "order_items", "products"
  add_foreign_key "orders", "addresses", column: "billing_address_id"
  add_foreign_key "orders", "addresses", column: "shipping_address_id"
  add_foreign_key "orders", "users"
  add_foreign_key "product_images", "products"
  add_foreign_key "product_property_values", "products"
  add_foreign_key "product_property_values", "property_definitions"
  add_foreign_key "product_variants", "products"
  add_foreign_key "products", "categories"
  add_foreign_key "products", "users"
  add_foreign_key "reviews", "products"
  add_foreign_key "reviews", "users"
  add_foreign_key "wishlist_items", "products"
  add_foreign_key "wishlist_items", "users"
end
