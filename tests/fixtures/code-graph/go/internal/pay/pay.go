package pay

import "database/sql"

type Provider interface {
	Charge(n int) error
}

type Bank struct{ db *sql.DB }

func (b *Bank) Charge(n int) error {
	_, err := b.db.Exec("INSERT INTO payments (amount) VALUES ($1)", n)
	return err
}

func Charge(p Provider, n int) error {
	return p.Charge(n)
}
