package order

import "example.com/shop/internal/pay"

func Checkout(p pay.Provider) error {
	return pay.Charge(p, 1)
}
