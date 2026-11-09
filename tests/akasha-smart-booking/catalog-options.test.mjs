import test from "node:test"
import assert from "node:assert/strict"
import {
  getSmartBookingCatalogOptions,
  toSmartBookingLine,
  smartBookingOptionLabel,
} from "../../lib/akasha-smart-booking/catalog-options.ts"

const productId = "11111111-1111-4111-8111-111111111111"
const variantId = "22222222-2222-4222-8222-222222222222"
const packageId = "33333333-3333-4333-8333-333333333333"
const saleProductId = "44444444-4444-4444-8444-444444444444"
const saleVariantId = "55555555-5555-4555-8555-555555555555"

function fixtureCatalog() {
  return {
    usahaNama: "Akasha Outdoor",
    items: [{
      barang_id: productId,
      nama: "Tenda",
      slug: "tenda",
      kategori_nama: "Shelter",
      deskripsi: null,
      ringkasan_publik: null,
      imageUrl: null,
      variants: [{
        barang_id: productId,
        varian_barang_id: variantId,
        barang_nama: "Tenda",
        nama: "4 Orang",
        kategori_nama: "Shelter",
        deskripsi: null,
        price: 50000,
        normalPrice: 50000,
        discountPercent: 0,
        priceDurationValue: 1,
        priceDurationUnit: "hari",
        currency_code: "IDR",
        inventory_mode: "serialized",
      }],
      directRentalOption: {
        key: "product:" + productId,
        kind: "product",
        barang_id: productId,
        varian_barang_id: null,
        paket_sewa_id: null,
        barang_nama: "Tenda kecil",
        varian_nama: null,
        kategori_nama: "Shelter",
        price: 30000,
        normalPrice: 30000,
        discountPercent: 0,
        priceDurationValue: 1,
        priceDurationUnit: "hari",
        currency_code: "IDR",
        inventory_mode: "serialized",
      },
      minPrice: 30000,
      minPriceDurationValue: 1,
      minPriceDurationUnit: "hari",
    }],
    packages: [{
      paket_sewa_id: packageId,
      nama: "Paket Camping",
      slug: "paket-camping",
      deskripsi: null,
      imageUrl: null,
      currency_code: "IDR",
      price: 90000,
      normalPrice: 100000,
      discountPercent: 10,
      priceDurationValue: 1,
      priceDurationUnit: "hari",
      priceSource: "tarif",
      canBook: true,
    }],
    sales: [{
      key: "sale-product:" + saleProductId,
      barang_id: saleProductId,
      varian_barang_id: null,
      barang_nama: "Jas hujan",
      varian_nama: null,
      kategori_nama: "Outfit",
      deskripsi: null,
      price: 15000,
      normalPrice: 15000,
      discountPercent: 0,
      currency_code: "IDR",
      inventory_mode: "quantity",
    }, {
      key: "sale-variant:" + saleVariantId,
      barang_id: saleProductId,
      varian_barang_id: saleVariantId,
      barang_nama: "Botol",
      varian_nama: "1 Liter",
      kategori_nama: "Aksesoris",
      deskripsi: null,
      price: 12000,
      normalPrice: 12000,
      discountPercent: 0,
      currency_code: "IDR",
      inventory_mode: "quantity",
    }],
  }
}

test("catalog options keep rental, package, and sale domains distinct", () => {
  const options = getSmartBookingCatalogOptions(fixtureCatalog())
  assert.deepEqual(
    options.map((option) => [option.key, option.kind, option.target_kind]),
    [
      ["product:" + productId, "rental", "product"],
      ["variant:" + variantId, "rental", "variant"],
      ["package:" + packageId, "rental", "package"],
      ["sale-product:" + saleProductId, "sale", "product"],
      ["sale-variant:" + saleVariantId, "sale", "variant"],
    ],
  )
})

test("rental product serializes one product target", () => {
  const [option] = getSmartBookingCatalogOptions(fixtureCatalog())
  assert.deepEqual(toSmartBookingLine(option, 2), {
    barang_id: productId,
    jumlah: 2,
  })
})

test("rental variant serializes the selected variant only", () => {
  const option = getSmartBookingCatalogOptions(fixtureCatalog()).find((item) => item.key === "variant:" + variantId)
  assert.ok(option)
  assert.deepEqual(toSmartBookingLine(option, 3), {
    varian_barang_id: variantId,
    jumlah: 3,
  })
})

test("rental package serializes the package target only", () => {
  const option = getSmartBookingCatalogOptions(fixtureCatalog()).find((item) => item.key === "package:" + packageId)
  assert.ok(option)
  assert.deepEqual(toSmartBookingLine(option, 1), {
    paket_sewa_id: packageId,
    jumlah: 1,
  })
})

test("sale product and sale variant use purchase-compatible target payloads", () => {
  const options = getSmartBookingCatalogOptions(fixtureCatalog())
  const product = options.find((item) => item.key === "sale-product:" + saleProductId)
  const variant = options.find((item) => item.key === "sale-variant:" + saleVariantId)
  assert.ok(product)
  assert.ok(variant)
  assert.deepEqual(toSmartBookingLine(product, 2), {
    barang_id: saleProductId,
    jumlah: 2,
  })
  assert.deepEqual(toSmartBookingLine(variant, 1), {
    varian_barang_id: saleVariantId,
    jumlah: 1,
  })
})

test("option labels disclose rental versus purchase to customers", () => {
  const options = getSmartBookingCatalogOptions(fixtureCatalog())
  assert.match(smartBookingOptionLabel(options[0]), /^Sewa · /)
  assert.match(smartBookingOptionLabel(options[3]), /^Beli · /)
})
