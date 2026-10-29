# Retrieval benchmark

- Thời điểm: 2026-10-29T14:53:07Z
- Dataset: `retrieval.jsonl` (71 case, sha256 `1b9902effcc1`)
- Embedding: `vertex:text-multilingual-embedding-002`; index: `knowledge_v1_d40a8a9f7d` (108 chunk, knowledge `c59a87ac328a`)
- Ngưỡng min_score: 0.6

| Mode | Hit@1 | Hit@3 | Hit@5 | Recall@5 | MRR | Empty | Wrong-type | Neg. FP |
|---|---|---|---|---|---|---|---|---|
| dense | 89.8% | 94.9% | 96.6% | 94.9% | 0.927 | 0.0% | 0.0% | 75.0% |
| bm25 | 83.1% | 91.5% | 91.5% | 90.7% | 0.873 | 8.5% | 0.0% | 100.0% |
| hybrid | 98.3% | 100.0% | 100.0% | 100.0% | 0.992 | 0.0% | 0.0% | 75.0% |

## dense

| Category | n | Hit@1 | Hit@5 | MRR |
|---|---|---|---|---|
| alias | 12 | 100.0% | 100.0% | 1.000 |
| faq | 5 | 100.0% | 100.0% | 1.000 |
| multi_doc | 4 | 100.0% | 100.0% | 1.000 |
| no_diacritics | 6 | 33.3% | 66.7% | 0.454 |
| policy | 5 | 80.0% | 100.0% | 0.900 |
| symptom | 24 | 100.0% | 100.0% | 1.000 |
| type_filter | 3 | 66.7% | 100.0% | 0.833 |
| negative (neg.) | 6 | - | FP 50.0% | - |
| negative_near (neg.) | 6 | - | FP 100.0% | - |

Quét ngưỡng min_score (thứ hạng không đổi, chỉ lọc điểm):

| min_score | Hit@5 | MRR | Empty | Neg. FP |
|---|---|---|---|---|
| 0.0 | 96.6% | 0.927 | 0.0% | 100.0% |
| 0.3 | 96.6% | 0.927 | 0.0% | 100.0% |
| 0.4 | 96.6% | 0.927 | 0.0% | 100.0% |
| 0.45 | 96.6% | 0.927 | 0.0% | 100.0% |
| 0.5 | 96.6% | 0.927 | 0.0% | 100.0% |
| 0.55 | 96.6% | 0.927 | 0.0% | 100.0% |
| 0.6 | 96.6% | 0.927 | 0.0% | 75.0% |
| 0.65 | 91.5% | 0.887 | 5.1% | 58.3% |
| 0.7 | 83.1% | 0.814 | 16.9% | 8.3% |

Trượt Hit@5:

- `rag-nodiac-003` «bi mat ngu ca tuan nay» kỳ vọng ['mat-ngu-keo-dai'] -> ['dau-vai-gay', 'viem-hong-cap', 'mun-trung-ca', 'viem-loet-da-day', 'trao-nguoc-da-day']
- `rag-nodiac-006` «dat lich kham nhu the nao» kỳ vọng ['thu-tuc-dat-lich'] -> ['kho-mat', 'ong-nghen', 'tieu-chay-cap-o-tre', 'dau-vai-gay', 'sot']

Negative còn trả kết quả:

- `rag-neg-002` «hôm nay thời tiết Hà Nội thế nào» -> ['ho-khan', 'sot', 'cam-cum-thong-thuong', 'kho-mat', 'dau-vai-gay']
- `rag-neg-003` «cách nấu phở bò ngon» -> ['ong-nghen', 'thua-can-beo-phi', 'trao-nguoc-da-day', 'dau-bung-kho-tieu', 'sot']
- `rag-neg-006` «mua vé máy bay đi Đà Nẵng» -> ['thu-tuc-dat-lich', 'huy-lich-doi-lich', 'dau-vai-gay', 'kham-suc-khoe-tong-quat', 'ong-nghen']
- `rag-negnear-001` «bệnh tiểu đường nên ăn gì» -> ['thua-can-beo-phi', 'tieu-chay-cap-o-tre', 'trao-nguoc-da-day', 'dau-bung-kho-tieu', 'viem-loet-da-day']
- `rag-negnear-002` «phẫu thuật bắc cầu động mạch vành» -> ['thoat-vi-dia-dem', 'dau-vai-gay', 'thu-tuc-dat-lich', 'sau-rang', 'kham-suc-khoe-tong-quat']
- `rag-negnear-003` «liều thuốc paracetamol cho người lớn» -> ['sot', 'thua-can-beo-phi', 'tieu-chay-cap-o-tre', 'mat-ngu-keo-dai', 'kham-suc-khoe-tong-quat']
- `rag-negnear-004` «lịch tiêm vắc xin cho trẻ sơ sinh» -> ['sot-moc-rang', 'thu-tuc-dat-lich', 'huy-lich-doi-lich', 'kham-suc-khoe-tong-quat', 'ong-nghen']
- `rag-negnear-005` «bệnh gout kiêng ăn gì» -> ['thua-can-beo-phi', 'dau-bung-kho-tieu', 'tieu-chay-cap-o-tre', 'viem-loet-da-day', 'sot']
- `rag-negnear-006` «xét nghiệm máu hết bao nhiêu tiền» -> ['kham-suc-khoe-tong-quat', 'kho-mat', 'sot']

## bm25

| Category | n | Hit@1 | Hit@5 | MRR |
|---|---|---|---|---|
| alias | 12 | 58.3% | 58.3% | 0.583 |
| faq | 5 | 100.0% | 100.0% | 1.000 |
| multi_doc | 4 | 100.0% | 100.0% | 1.000 |
| no_diacritics | 6 | 66.7% | 100.0% | 0.833 |
| policy | 5 | 80.0% | 100.0% | 0.900 |
| symptom | 24 | 95.8% | 100.0% | 0.979 |
| type_filter | 3 | 66.7% | 100.0% | 0.833 |
| negative (neg.) | 6 | - | FP 100.0% | - |
| negative_near (neg.) | 6 | - | FP 100.0% | - |

Trượt Hit@5:

- `rag-alias-003` «eczema» kỳ vọng ['viem-da-co-dia'] -> []
- `rag-alias-004` «pink eye» kỳ vọng ['dau-mat-do'] -> []
- `rag-alias-005` «acne» kỳ vọng ['mun-trung-ca'] -> []
- `rag-alias-006` «insomnia» kỳ vọng ['mat-ngu-keo-dai'] -> []
- `rag-alias-010` «gastritis» kỳ vọng ['viem-loet-da-day'] -> []

Negative còn trả kết quả:

- `rag-neg-001` «giá vàng hôm nay là bao nhiêu» -> ['sot', 'dau-mat-do', 'ho-khan', 'cam-cum-thong-thuong', 'mun-trung-ca']
- `rag-neg-002` «hôm nay thời tiết Hà Nội thế nào» -> ['tieu-chay-cap-o-tre', 'ho-khan', 'huy-lich-doi-lich', 'dau-rang-khon', 'viem-am-dao']
- `rag-neg-003` «cách nấu phở bò ngon» -> ['sau-rang', 'viem-da-co-dia', 'thoat-vi-dia-dem', 'dau-bung-kho-tieu', 'sot-moc-rang']
- `rag-neg-004` «viết giúp tôi đoạn code python sắp xếp mảng» -> ['huy-lich-doi-lich', 'cam-cum-thong-thuong', 'kham-suc-khoe-tong-quat', 'thua-can-beo-phi', 'ong-nghen']
- `rag-neg-005` «tỷ số trận bóng đá tối qua» -> ['viem-da-co-dia', 'thua-can-beo-phi', 'dau-mat-do', 'roi-loan-lo-au', 'huy-lich-doi-lich']
- `rag-neg-006` «mua vé máy bay đi Đà Nẵng» -> ['mat-ngu-keo-dai', 'noi-man-do-ngua', 'dau-mat-do', 'mun-trung-ca', 'thua-can-beo-phi']
- `rag-negnear-001` «bệnh tiểu đường nên ăn gì» -> ['kham-suc-khoe-tong-quat', 'thua-can-beo-phi', 'sot', 'cam-cum-thong-thuong', 'ong-nghen']
- `rag-negnear-002` «phẫu thuật bắc cầu động mạch vành» -> ['kham-suc-khoe-tong-quat', 'trao-nguoc-da-day', 'thu-tuc-dat-lich', 'thoat-vi-dia-dem', 'huy-lich-doi-lich']
- `rag-negnear-003` «liều thuốc paracetamol cho người lớn» -> ['thua-can-beo-phi', 'huy-lich-doi-lich', 'cam-cum-thong-thuong', 'ong-nghen', 'viem-da-co-dia']
- `rag-negnear-004` «lịch tiêm vắc xin cho trẻ sơ sinh» -> ['ong-nghen', 'sot-moc-rang', 'ho-khan', 'thua-can-beo-phi', 'tieu-chay-cap-o-tre']
- `rag-negnear-005` «bệnh gout kiêng ăn gì» -> ['cam-cum-thong-thuong', 'thua-can-beo-phi', 'kham-suc-khoe-tong-quat', 'trao-nguoc-da-day', 'viem-da-co-dia']
- `rag-negnear-006` «xét nghiệm máu hết bao nhiêu tiền» -> ['sot', 'dau-mat-do', 'tieu-chay-cap-o-tre', 'viem-am-dao', 'roi-loan-lo-au']

## hybrid

| Category | n | Hit@1 | Hit@5 | MRR |
|---|---|---|---|---|
| alias | 12 | 100.0% | 100.0% | 1.000 |
| faq | 5 | 100.0% | 100.0% | 1.000 |
| multi_doc | 4 | 100.0% | 100.0% | 1.000 |
| no_diacritics | 6 | 83.3% | 100.0% | 0.917 |
| policy | 5 | 100.0% | 100.0% | 1.000 |
| symptom | 24 | 100.0% | 100.0% | 1.000 |
| type_filter | 3 | 100.0% | 100.0% | 1.000 |
| negative (neg.) | 6 | - | FP 50.0% | - |
| negative_near (neg.) | 6 | - | FP 100.0% | - |

Quét ngưỡng min_score (thứ hạng không đổi, chỉ lọc điểm):

| min_score | Hit@5 | MRR | Empty | Neg. FP |
|---|---|---|---|---|
| 0.0 | 100.0% | 0.992 | 0.0% | 100.0% |
| 0.3 | 100.0% | 0.992 | 0.0% | 100.0% |
| 0.4 | 100.0% | 0.992 | 0.0% | 100.0% |
| 0.45 | 100.0% | 0.992 | 0.0% | 100.0% |
| 0.5 | 100.0% | 0.992 | 0.0% | 100.0% |
| 0.55 | 100.0% | 0.992 | 0.0% | 100.0% |
| 0.6 | 100.0% | 0.992 | 0.0% | 75.0% |
| 0.65 | 91.5% | 0.915 | 6.8% | 50.0% |
| 0.7 | 83.1% | 0.831 | 16.9% | 0.0% |

Negative còn trả kết quả:

- `rag-neg-002` «hôm nay thời tiết Hà Nội thế nào» -> ['ho-khan', 'cam-cum-thong-thuong', 'sot', 'kho-mat']
- `rag-neg-003` «cách nấu phở bò ngon» -> ['trao-nguoc-da-day', 'tieu-chay-cap-o-tre', 'viem-loet-da-day', 'ong-nghen', 'sot']
- `rag-neg-006` «mua vé máy bay đi Đà Nẵng» -> ['thu-tuc-dat-lich', 'huy-lich-doi-lich', 'kham-suc-khoe-tong-quat', 'sot']
- `rag-negnear-001` «bệnh tiểu đường nên ăn gì» -> ['thua-can-beo-phi', 'kham-suc-khoe-tong-quat', 'trao-nguoc-da-day', 'tieu-chay-cap-o-tre', 'ong-nghen']
- `rag-negnear-002` «phẫu thuật bắc cầu động mạch vành» -> ['thu-tuc-dat-lich', 'trao-nguoc-da-day', 'thoat-vi-dia-dem', 'huy-lich-doi-lich', 'kham-suc-khoe-tong-quat']
- `rag-negnear-003` «liều thuốc paracetamol cho người lớn» -> ['thua-can-beo-phi', 'sot', 'thoat-vi-dia-dem', 'cam-cum-thong-thuong', 'kham-suc-khoe-tong-quat']
- `rag-negnear-004` «lịch tiêm vắc xin cho trẻ sơ sinh» -> ['ong-nghen', 'ho-khan', 'thu-tuc-dat-lich', 'sot-moc-rang', 'huy-lich-doi-lich']
- `rag-negnear-005` «bệnh gout kiêng ăn gì» -> ['thua-can-beo-phi', 'tieu-chay-cap-o-tre', 'viem-loet-da-day', 'sau-rang', 'noi-man-do-ngua']
- `rag-negnear-006` «xét nghiệm máu hết bao nhiêu tiền» -> ['sot']
