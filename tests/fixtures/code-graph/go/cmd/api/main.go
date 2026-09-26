package main

import (
	"net/http"

	"example.com/shop/internal/order"
)

func handleCheckout(w http.ResponseWriter, r *http.Request) {
	_ = order.Checkout(nil)
}

func main() {
	http.HandleFunc("POST /checkout", handleCheckout)
}
