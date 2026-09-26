from shop.pay import charge


@app.post("/refund")
def refund_view(req):
    return charge(1)
