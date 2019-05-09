Local invoke - subscriptions

```console
sam local invoke ControlProcessor -e subscribe-event.json -n sub-env.json
```

For the above I've set AWS_PROFILE and AWS_REGION.

Unsubscribe

```console
sam local invoke ControlProcessor -e unsub-event.json -n sub-env.json
```

List subscriptions

```console
sam local invoke ListSubs -e list-subs-event.json -n sub-env.json
```

Advertise topic

```console
sam local invoke ControlProcessor -e advertise-topic.json -n sub-env.json
```