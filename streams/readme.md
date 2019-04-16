Local invoke - subscriptions

```console
sam local invoke ControlProcessor -e subscribe-event.json -n sub-env.json
```

Local invoke - publish

```console
sam local invoke StreamProcessor -e send-event.json -n sub-env.json
```

For the above I've set AWS_PROFILE and AWS_REGION.
