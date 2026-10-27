# Responsible use

Kalki generates synthetic video. These rules are part of its design, and some are enforced by `tests/policy.test.ts`.

## Provenance stays on

The Producer tags every file with `comment=AI-generated content (created with Kalki)` and `encoder=Kalki`. Kalki does not remove C2PA manifests, SynthID or any other provenance signal a provider embeds, and it does not write fake camera, device or date metadata. Contributions that do any of these will not be merged.

## Disclose when you publish

Uploading is manual. When you post a Kalki video, turn on the platform's disclosure setting for altered or synthetic content (YouTube has one), and follow its policies on AI-generated media, spam and repetitive content.

## Providers on their own terms

Kalki calls each provider only with an API key you supply, under your account, and stays within each provider's terms.

## People and likeness

Characters are fictional by default. Do not create characters that impersonate real people, and do not use reference images of anyone without their consent.

## Reporting misuse

If you find a feature that makes misuse easier, open an issue. For a security problem, follow the [security policy](https://github.com/harshitwandhare/kalki/security/policy).
