+++
title = "How to create on-chain SVG NFTs on Aptos."
description = "In this article, I'll walk you through the process of making on-chain SVG NFTs on Aptos using Move lang."
date = 2023-01-08

[taxonomies]
tags = ["aptos", "move", "NFT"]
+++

## Hmm, what is on-chain SVG NFT?

Instead of deploying your artwork and metadata on IPFS and then using the link to that metadata for the NFT uri, we generate everything on chain using the [data urls](https://www.google.com/search?q=url+data%3A&oq=url+data%3A&aqs=chrome..69i57.5889j0j1&sourceid=chrome&ie=UTF-8) and the NFT image is represented using SVG.

## How's that done ?

Consider this svg is something we want to use as an image for our NFT.

```html
<svg
  height="600"
  width="400"
  fill="black"
  viewBox="0 0 400 600"
  xmlns="http://www.w3.org/2000/svg"
>
  <text x="10" y="40" class="small">Dynaimic NFT #1</text>
</svg>
```

So, you can convert it into base64 and it'll result in

```
PHN2ZyBoZWlnaHQ9IjYwMCIgd2lkdGg9IjQwMCIgZmlsbD0iYmxhY2siIHZpZXdCb3g9IjAgMCA0MDAgNjAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjEwIiB5PSI0MCIgY2xhc3M9InNtYWxsIj5EeW5haW1pYyBORlQgIzE8L3RleHQ+PC9zdmc+
```

Now you can append `data:image/svg+xml;base64,` in front of the base64 image to get the data url which can be understood by most browser.

```
data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjYwMCIgd2lkdGg9IjQwMCIgZmlsbD0iYmxhY2siIHZpZXdCb3g9IjAgMCA0MDAgNjAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjx0ZXh0IHg9IjEwIiB5PSI0MCIgY2xhc3M9InNtYWxsIj5EeW5haW1pYyBORlQgIzE8L3RleHQ+PC9zdmc+
```

### What about the metadata?

Consider that we want to use the following metadata.

```json
{
  "name": "Test Dynamic NFT #",
  "description": "description goes here.",
  "image": "data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjYwMCIgd2lkdGg9IjQwMCIgZmlsbD0iYmxhY2siCiB2aWV3Qm94PSIwIDAgNDAwIDYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8c3R5bGU+CiAgICBzdmcgewogICAgICBiYWNrZ3JvdW5kOiBibGFjazsKICAgIH0KICAgIC5zbWFsbCB7CiAgICAgIGZpbGw6IHdoaXRlOwogICAgfQogIDwvc3R5bGU+CgogIDx0ZXh0IHg9IjEwIiB5PSI0MCIgY2xhc3M9InNtYWxsIj5EeW5haW1pYyBORlQgIzQ8L3RleHQ+Cjwvc3ZnPg==",
  "attributes": []
}
```

You'll again convert it into base64 and append `data:application/json;base64,` in front of the encoded string to represent a data url that will return json.

```
data:application/json;base64,eyJuYW1lIjogIlRlc3QgRHluYW1pYyBORlQgIzEiLCAiZGVzY3JpcHRpb24iOiAiSXQiLCAiaW1hZ2UiOiAiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlCb1pXbG5hSFE5SWpZd01DSWdkMmxrZEdnOUlqUXdNQ0lnWm1sc2JEMGlZbXhoWTJzaUlIWnBaWGRDYjNnOUlqQWdNQ0EwTURBZ05qQXdJaUI0Yld4dWN6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNakF3TUM5emRtY2lQangwWlhoMElIZzlJakV3SWlCNVBTSTBNQ0lnWTJ4aGMzTTlJbk50WVd4c0lqNUVlVzVoYVcxcFl5Qk9SbFFnSXpFOEwzUmxlSFErUEM5emRtYysifQ==
```

And this is going to be the url of our NFT and the value that be'll be using for the URI.

## Move modules for on chain SVG NFT.

We'll we need to first of all implement base64 in move in order to encode the text into base64, I personally reffered to [this article](https://nachtimwald.com/2017/11/18/base64-encode-and-decode-in-c/) to learn how to impplement base64 and here's the code in move for it.

```move
module rangers::base64 {
    use std::string::{Self, String};
    use std::vector;

    const B64_CHARS: vector<u8> = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    public fun b64_encoded_size(l: u64): u64 {
        let ret = l;
        if (l % 3 != 0) {
            ret = ret + (3 - (l % 3));
        };
        ret = ret / 3;
        ret = ret * 4;
        ret
    }

    public fun b64_decoded_size(str: String): u64 {
        let length = string::length(&str);
        let bytes = string::bytes(&str);
        let ret = length / 4 * 3;

        let i = length - 1;
        while (i > 0) {
            if (*vector::borrow<u8>(bytes, i) == 61) {
                ret = ret - 1;
            } else {
                break
            };
            i = i - 1;
        };
        ret
    }

    public fun b64_isvalidchar(c: u8): bool {
        if (c >= 65 && c <= 90) {
            return true
        } else if (c >= 97 && c <= 122) {
            return true
        } else if (c >= 48 && c <= 57) {
            return true
        } else if (c == 43 || c == 47 || c == 61) {
            return true
        } else {
            return false
        }
    }

    public fun encode_string(str: String): String {
        let length = string::length(&str);
        let bytes = string::bytes(&str);
        assert!(length > 0, 0);

        let i: u64 = 0;
        let j: u64 = 0;
        let out: vector<u8> = vector::empty<u8>();
        let elen: u64 = b64_encoded_size(length);

        let t = 0;
        while (t < elen) {
            vector::push_back<u8>(&mut out, 0);
            t = t + 1;
        };

        while (i < length) {
            let v = (*vector::borrow<u8>(bytes, i) as u64);

            if (i + 1 < length) {
                v = (( (v as u64) << 8) | (*vector::borrow<u8>(bytes, i + 1) as u64) );
            } else {
                v = v << 8;
            };

            if (i + 2 < length) {
                v = (( (v as u64) << 8) | (*vector::borrow<u8>(bytes, i + 2) as u64) );
            } else {
                v = v << 8;
            };

            *vector::borrow_mut<u8>(&mut out, j) = *vector::borrow<u8>(&B64_CHARS, (( v >> 18 ) & 0x3f));
            *vector::borrow_mut<u8>(&mut out, j + 1) = *vector::borrow<u8>(&B64_CHARS, (( (v as u64) >> 12 ) & 0x3f));

            if (i + 1 < length) {
                *vector::borrow_mut<u8>(&mut out, j + 2) = *vector::borrow<u8>(&B64_CHARS, (((v >> 6) & 0x3f) as u64));
            } else {
                *vector::borrow_mut<u8>(&mut out, j + 2) = 61; // '='
            };

            if (i + 2 < length) {
                std::debug::print(&(v & 0x3f));
                *vector::borrow_mut<u8>(&mut out, j + 3) = *vector::borrow<u8>(&B64_CHARS, ((v & 0x3f)));
            } else {
                *vector::borrow_mut<u8>(&mut out, j + 3) = 61; // '='
            };

            i = i + 3;
            j = j + 4;
        };

        string::utf8(out)
    }

    #[test]
    fun test_encode_string() {
        assert!(encode_string(string::utf8(b"Hello World")) == string::utf8(b"SGVsbG8gV29ybGQ="), 0);
        assert!(encode_string(string::utf8(b"Hello World!")) == string::utf8(b"SGVsbG8gV29ybGQh"), 0);
        assert!(b64_decoded_size(string::utf8(b"SGVsbG8gV29ybGQh")) == 12, 0);
    }
}
```

### Writing dead simple contract to mint svg NFT.

We're gonna start by adding function to generate base64 encoded image from by inputing an number that'll be dynamically added to the SVG.

<!-- {{monaco()}} -->

```move
public fun to_string(value: u64): String {
    if (value == 0) {
        return string::utf8(b"0")
    };
    let buffer = vector::empty<u8>();
    while (value != 0) {
        vector::push_back(&mut buffer, ((48 + value % 10) as u8));
        value = value / 10;
    };
    vector::reverse(&mut buffer);
    string::utf8(buffer)
}

public fun generate_base64_image(i: u64): String {
    let image = string::utf8(b"<svg height=\"600\" width=\"400\" fill=\"black\" viewBox=\"0 0 400 600\" xmlns=\"http://www.w3.org/2000/svg\"><text x=\"10\" y=\"40\" class=\"small\">Dynaimic NFT #");
    string::append(&mut image, to_string(i));
    string::append(&mut image, string::utf8(b"</text></svg>"));

    let encoded = string::utf8(b"data:image/svg+xml;base64,");
    string::append(&mut encoded, base64::encode_string(image));
    encoded
}
```

In the same way now'll write a function that'll take this encoded image and the same number to generate encoded json metadata url.

```move
public fun generate_base64_metadata(img: String, i: u64): String {
    let metadata = string::utf8(b"{\"name\": \"Test Dynamic NFT #");
    string::append(&mut metadata, to_string(i));
    string::append(&mut metadata, string::utf8(b"\", \"description\": \"It\", \"image\": \""));
    string::append(&mut metadata, img);
    string::append(&mut metadata, string::utf8(b"\"}"));

    let encoded = string::utf8(b"data:application/json;base64,");
    string::append(&mut encoded, base64::encode_string(metadata));
    encoded
}
```

> 📝 The current NFT standard i.e `0x3::token` on Aptos has a constraint for the length of uri to `512`. So RN we can't generate an metadata url with length more tahn `512` for now ofc. Let's see what'll happen in the future.

Allright, now since that's out of our way now we can focus on actual move module to mint and create collection.

The constructor will create a resource account for the deployer and store it in the `ResourceSigner` resource owned by the deployer. We'll need this resource account to create collection and mint NFT.

```move
use aptos_framework::account::{Self, SignerCapability};

struct ResourceSigner has key {
    cap: SignerCapability
}

fun assert_admin(a: &signer) {
    assert!(signer::address_of(a) == @rangers, 0);
}

fun init_module(account: &signer) {
    assert_admin(account);
    let (_, cap) = account::create_resource_account(account, b"SOME-TEXT-GOES-HERE");
    move_to(account, ResourceSigner { cap: cap });
}
```

Let's write function for allowing the deployer to create NFT collection and store necessary information in a resource.

```move
struct MintingInfo has key {
    index: u64,
    base_name: String,
    collection_name: String,
}

fun resource_account(): (signer, address) acquires ResourceSigner {
    let resource = borrow_global<ResourceSigner>(@rangers);
    (account::create_signer_with_capability(&resource.cap), account::get_signer_capability_address(&resource.cap))
}

public entry fun create_collection(account: &signer) acquires ResourceSigner {
    assert_admin(account);
    let (resource, _) = resource_account();
    token::create_collection(
        &resource,
        string::utf8(b"Test Dynamic NFT"),
        string::utf8(b"Testing dynamic NFTs."),
        string::utf8(b"https://vivek.ink"),
        1000,
        vector<bool>[false, false, false]
    );

    move_to(account, MintingInfo {
        index: 1,
        base_name: string::utf8(b"Test NFT #"),
        collection_name: string::utf8(b"Test Dynamic NFT"),
    });
}
```

Now finally let's write a function that mints an NFT from our generated resource account and then transfers it to the caller.

> 📝: This is the function you can modify to allow a certain amount of APT or any token to be paid in order for the caller to mint this NFT.

```move
public entry fun mint_nft(account: &signer) acquires ResourceSigner, MintingInfo {
    let (resource, resource_addr) = resource_account();
    let minting_info = borrow_global_mut<MintingInfo>(@rangers);

    let name = string::utf8(b"");
    string::append(&mut name, minting_info.base_name);
    string::append(&mut name, to_string(minting_info.index));
    let img = generate_base64_image(minting_info.index);
    let uri = generate_base64_metadata(img, minting_info.index);
    std::debug::print(&uri);

    minting_info.index = minting_info.index + 1;

    let token_mut_config = token::create_token_mutability_config(&vector<bool>[false, false, false, false, false]);
    let tokendata_id = token::create_tokendata(
        &resource,
        minting_info.collection_name,
        name,
        string::utf8(b"This is some bullshit description."),
        1,
        uri,
        @rangers,
        100,
        5,
        token_mut_config,
        vector<String>[],
        vector<vector<u8>>[],
        vector<String>[],
    );

    token::mint_token(&resource, tokendata_id, 1);

    let token_id = token::create_token_id_raw(resource_addr, minting_info.collection_name, name, 0);
    token::direct_transfer(&resource, account, token_id, 1);
}
```

And that's how you can create an on chain dynamic NFT module in move lang. To interact with the module you can write some move scripts.

```move
script {
    use rangers::mint_dynamic_nft;

    fun main(src: &signer) {
        mint_dynamic_nft::create_collection(src);
    }
}
```

```move
script {
    use rangers::mint_dynamic_nft;

    fun mint(src: &signer) {
        mint_dynamic_nft::mint_nft(src);
    }
}
```

I did this on a small livestream, feel free to check it out.
[https://www.youtube.com/watch?v=2SZIWzAOBtM](https://www.youtube.com/watch?v=2SZIWzAOBtM) and if you need any help feel free to DM me on twitter [@0xStateMachine](https://twitter.com/0xStateMachine)
