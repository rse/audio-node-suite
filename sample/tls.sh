
#   generate CA certificate/key pair
if [ ! -f tls-ca.crt ]; then
    (   echo "{"
        echo "    \"key\": {"
        echo "        \"algo\": \"rsa\","
        echo "        \"size\": 4096"
        echo "    },"
        echo "    \"ca\": {"
        echo "        \"expiry\": \"87600h\","
        echo "        \"pathlen\": 1"
        echo "    },"
        echo "    \"CN\": \"CA\","
        echo "    \"names\": ["
        echo "        {"
        echo "            \"OU\": \"Certificate Authority\""
        echo "        }"
        echo "    ]"
        echo "}"
    ) | \
    cfssl genkey -loglevel=1 -initca - | \
        cfssl-json -bare tls-ca
    rm -f ca.csr
    chmod 600 tls-ca.key
    chmod 644 tls-ca.crt
    (   echo "{"
        echo "    \"signing\": {"
        echo "        \"profiles\": {"
        echo "            \"peer\": {"
        echo "                \"expiry\": \"87600h\","
        echo "                \"usages\": ["
        echo "                    \"signing\","
        echo "                    \"key encipherment\","
        echo "                    \"server auth\","
        echo "                    \"client auth\""
        echo "                ]"
        echo "            },"
        echo "            \"server\": {"
        echo "                \"expiry\": \"87600h\","
        echo "                \"usages\": ["
        echo "                    \"signing\","
        echo "                    \"key encipherment\","
        echo "                    \"server auth\""
        echo "                ]"
        echo "            },"
        echo "            \"client\": {"
        echo "                \"expiry\": \"87600h\","
        echo "                \"usages\": ["
        echo "                    \"signing\","
        echo "                    \"key encipherment\","
        echo "                    \"client auth\""
        echo "                ]"
        echo "            }"
        echo "        }"
        echo "    }"
        echo "}"
    ) >tls-ca.json
    chmod 644 tls-ca.json
fi

#   generate server certificate/key pair
(   echo "{"
    echo "    \"key\": {"
    echo "        \"algo\": \"rsa\","
    echo "        \"size\": 4096"
    echo "    },"
    echo "    \"CN\": \"$1\","
    echo "    \"hosts\": ["
    i=0
    for host in "$@"; do
        echo -n "        \"$host\""
        i=`expr $i + 1`
        if [ $i -lt $# ]; then
            echo -n ","
        fi
        echo ""
    done
    echo "    ]"
    echo "}"
) | \
cfssl gencert -loglevel=1 -ca tls-ca.crt -ca-key tls-ca.key -config tls-ca.json -profile=server - | \
    cfssl-json -bare tls-sv
rm -f tls-sv.csr
chmod 600 tls-sv.key
chmod 644 tls-sv.crt

