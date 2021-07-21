exports.sendAck = (ack, payload) => {
    if (!(ack && typeof ack === 'function')) return

    if (payload && payload.error) {
        delete payload.error.stack
        payload.error = JSON.parse(
            JSON.stringify(
                payload.error,
                Object.getOwnPropertyNames(payload.error),
            ),
        )
    }

    ack(payload)
}
