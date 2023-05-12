import {useEffect, useRef, useState} from "react";
import React from 'react'
import {
  CAvatar, CBadge, CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol, CContainer,
  CForm, CFormSwitch,
  CInputGroup,
  CInputGroupText, CLink, CPagination, CPaginationItem,
  CRow, CSpinner,
  CTable, CTableBody, CTableDataCell,
  CTableHead, CTableHeaderCell, CTableRow, CTooltip
} from "@coreui/react";
import * as PropTypes from "prop-types";
import {build} from "../../components/categoryNode";
import {TreeSelect} from 'primereact/treeselect';
import 'primereact/resources/primereact.css';                       // core css
import 'primereact/resources/themes/lara-light-indigo/theme.css';   // theme
import {APIHost, ConvertToTreeSelect, MongoAggregate} from "../../api";
import {InputNumber} from 'primereact/inputnumber';
import {SelectButton} from 'primereact/selectbutton';
import CIcon from "@coreui/icons-react";
import {cilHistory, cilMediaPlay, cilMediaStop} from "@coreui/icons";
import "src/css/ProductDetail.css";
import {Avatar} from 'primereact/avatar';
import {Badge} from "primereact/badge";
import {MultiSelect} from 'primereact/multiselect';
import {Toast} from "primereact/toast";
import {Paginator} from 'primereact/paginator';
import {Calendar} from 'primereact/calendar';

import {Image} from 'primereact/image';


function MyTreeSelect({onNodeSelect}) {
  const [nodes, setNodes] = useState(null);
  const [selectedNodeKey, setSelectedNodeKey] = useState(null);

  useEffect(() => {
    ConvertToTreeSelect().then((res) => {
      if (res) {
        setNodes([res]);
      }
    })
  }, []);


  return (
    <div className="card flex justify-content-center">
      <div className="card flex justify-content-center">
        <TreeSelect value={selectedNodeKey} onChange={(e) => setSelectedNodeKey(e.value)}
                    options={nodes}
                    onNodeSelect={(e) => onNodeSelect(e)}
                    className="md:w-20rem w-full" placeholder="分类选择"></TreeSelect>
      </div>
    </div>
  );
}

MyTreeSelect.propTypes = {onNodeSelect: PropTypes.func.isRequired};

function truncateText(text, maxLength) {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + '...';
  }
  return text;
}

function base64ToBlob(base64Data, contentType) {
  contentType = contentType || '';
  const sliceSize = 1024;
  const byteCharacters = atob(base64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);

    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, {type: contentType});
  return blob;
}

function formatTimestamp(timestamp) {
  var date = new Date(timestamp * 1000);
  var year = date.getFullYear();
  var month = ("0" + (date.getMonth() + 1)).slice(-2);
  var day = ("0" + date.getDate()).slice(-2);
  var hours = ("0" + date.getHours()).slice(-2);
  var minutes = ("0" + date.getMinutes()).slice(-2);
  var seconds = ("0" + date.getSeconds()).slice(-2);
  var formattedDate = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
  return formattedDate;
}

function Home() {
  const [path, setPath] = useState("");
  const [p1, setP1] = useState(0);
  const [p2, setP2] = useState(1000);
  const [r1, setR1] = useState(0);
  const [r2, setR2] = useState(100000);

  const [r3, setR3] = useState(0);
  const [r4, setR4] = useState(100);


  const [loading, setLoading] = React.useState(false);
  const [selectedCities, setSelectedCities] = useState([]);
  const [page, setPage] = useState(1);
  const handleSelect = selectedItems => {
    setPath(selectedItems.node.data);
  };
  const cities = [
    {name: '价格↓', code: {"productvalues.price": -1}},
    {name: '评分↓', code: {'productvalues.rating': -1}},
    {name: '主排行↑', code: {"productvalues.mainranking": 1}},
    {name: '子排行↑', code: {"productvalues.subranking": 1}},
    {name: '类目排行↑', code: {"category_info.rank": 1}},
    {name: '评论数↓', code: {"productvalues.reviewcount": -1}},
    {name: '评级数↓', code: {"productvalues.ratingscount": -1}},
  ];

  const model = [
    {name: 'AMZ', value: 'AMZ'},
    {name: 'FBM', value: 'FBM'},
    {name: 'FBA', value: 'FBA'},
  ]

  const pageLimitOptions = [
    {label: '10', value: 10},
    {label: '20', value: 20},
    {label: '50', value: 50},
    {label: '100', value: 100},
  ]

  const onCityChange = (e) => {
    setSelectedCities(e.value);
    console.log(e.value);
  }
  const toast = useRef(null);

  const show_toast = (severity, msg) => {
    toast.current.show({severity: severity, summary: severity, detail: msg});
  };
  const [modelValue, setmodelValue] = useState([]);
  const [pageLimit, setPageLimit] = useState(10);
  const [first, setFirst] = useState(0);
  const [data, setData] = useState([]);
  const [needMatchBrand, setNeedMatchBrand] = useState(false);
  const [needsellerNameContainsBrand, setNeedsellerNameContainsBrand] = useState(false);
  const [count, setCount] = useState(0);
  const [datetime24hStart, setDatetime24hStart] = useState(null);
  const [datetime24hEnd, setDatetime24hEnd] = useState(null);
  const [othersellercount, setOthersellercount] = useState(0);

  //打印datetime24hStart，当datetime24hStart改变时，打印出来
  useEffect(() => {
    if (datetime24hStart) {
      console.log(datetime24hStart.getTime());

    }
  }, [datetime24hStart]);


  const [downloadLoading, setDownloadLoading] = useState(false);
  const downloadFile = () => {
    let data = getmongodata()
    data.pipeline.push(
      {
        "$project": {
          "ASIN": "$asin",
          "品牌": "$brand",
          "品牌为空": "$brandempty",
          "库存量": "$productvalues.availability",
          "主要排名": "$productvalues.mainranking",
          "其他卖家数量": "$productvalues.othersellercount",
          "原始价格": "$productvalues.priceRaw",
          "可能不允许跟卖": "$sellernamecontainsbrand",
          "评分": "$productvalues.rating",
          "评分人数": "$productvalues.ratingscount",
          "评论数量": "$productvalues.reviewcount",
          "子排名": "$productvalues.subranking",
          "运输方式": "$deliveryinfo.mode",
          "卖家名称": "$deliveryinfo.info.sellerName",
          "尺寸": "$size",
          "_id": 0,
          "上次更新时间": "$lasttime",
          "价格": "$price",
          "链接": {
            "$concat": [
              "https://www.amazon.ca/dp/",
              "$asin",
              "?th=1&psc=1"
            ]
          }
        }
      }
    )
    setDownloadLoading(true);
    fetch(APIHost + '/download/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }).then(response => {
      if (response.status === 200) {
        return response.json();
      } else {
        //throw new Error('下载请求失败');
        show_toast('error', '下载请求失败')
      }
    }).then(data => {
      if (data.status === 'ok') {
        // 解码base64数据
        const base64Data = data.result;
        const contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        const blob = base64ToBlob(base64Data, contentType);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        let timestamp = Date.parse(new Date());
        a.download = timestamp + '.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        show_toast('error', data.error)
      }
    }).catch(error => {
      console.error(error);
      show_toast('error', error.message)
    }).finally(() => {
      setDownloadLoading(false);
    });
  }

  const getmongodata = () => {
    let timestamp = Date.parse(new Date());
    let data = {
      "collection": "ProductDetail",
      "time": timestamp,
      "pipeline": [
        {
          "$match": {
            "price": {"$exists": true, "$ne": ""},
            "productvalues.price": {
              "$gt": p1,
              "$lte": p2
            },
            "productvalues.mainranking": {
              "$gte": r1,
              "$lte": r2
            },
            "productvalues.subranking": {
              "$gte": r3,
              "$lte": r4
            },
            "productvalues.othersellercount": {
              "$gte": othersellercount,
            }
          }
        },
        {
          "$lookup": {
            "from": "Products",
            "localField": "asin",
            "foreignField": "id",
            "as": "category_info"
          }
        },
        {
          "$match": {
            "category_info.path": {"$regex": "^" + path}
          }
        },
        {
          "$lookup": {
            "from": "Brands",
            "localField": "brand",
            "foreignField": "brand",
            "as": "brandInfo"
          }
        }
      ]
    };
    if (modelValue.length > 0) {
      data.pipeline[0].$match["deliveryinfo.mode"] = {
        "$in": modelValue
      }
    }

    let lastmatch = {
      "$match": {}
    }

    let firstmatch = {
      "$match": {}
    }


    if (datetime24hStart) {
      if (!lastmatch.$match.lasttime) {
        lastmatch.$match.lasttime = {}
      }

      lastmatch.$match.lasttime.$gte = Math.floor(datetime24hStart.getTime() / 1000)
    }

    if (datetime24hEnd) {
      if (!lastmatch.$match.lasttime) {
        lastmatch.$match.lasttime = {}
      }
      lastmatch.$match.lasttime.$lt = Math.floor(datetime24hEnd.getTime() / 1000)
    }

    if (needMatchBrand) {
      lastmatch.$match.$or = [
        {
          "brandInfo.data.numFound": {
            "$exists": false
          }
        },
        {
          "brandInfo.data.numFound": {
            "$eq": 0
          }
        }
      ]
    }

    if (needsellerNameContainsBrand) {
      // 匹配sellerNameContainsBrand为空或者为false的
      firstmatch.$match.$or = [
        {
          "sellernamecontainsbrand": {
            "$exists": false
          }
        },
        {
          "sellernamecontainsbrand": false

        }
      ]
    }

    if (Object.keys(firstmatch.$match).length > 0) {
      data.pipeline.push(firstmatch)
    }

    // 如果lastmatch.$match不为空，就加入到pipeline里面
    if (Object.keys(lastmatch.$match).length > 0) {
      data.pipeline.push(lastmatch)
    }


    return data;
  }

  const onPageChange = (event) => {
    setPageLimit(event.rows);
    query(event.page + 1);
  };
  const query = (page) => {
    setLoading(true);
    setPage(page)
    setFirst(pageLimit * (page - 1));
    let data = getmongodata();

    if (page == 1) {
      // 拷贝一份data
      let data2 = JSON.parse(JSON.stringify(data));
      data2.pipeline.push(
        {"$count": "result_count"}
      )

      // 查询总数
      MongoAggregate(data2).then((res) => {
        if (res.status === "ok") {
          setCount(res.result[0].result_count);
        } else {
          show_toast('error', res.error)
          setCount(0)
        }
      })
    }


    if (selectedCities.length > 0) {
      let sort = {};
      selectedCities.forEach((item) => {
        sort = {...sort, ...item.code}
      })
      data.pipeline.push({
        "$sort": sort
      })
    }

    data.pipeline.push(
      {
        "$skip": pageLimit * (page - 1)
      }
    )

    data.pipeline.push(
      {
        "$limit": pageLimit
      }
    )

    data.pipeline.push(
      {
        "$project": {
          "asin": 1,
          "brand": 1,
          "brandInfo": 1,
          "productvalues": 1,
          "title": 1,
          "mode": "$deliveryinfo.mode",
          "sellerName": "$deliveryinfo.info.sellerName",
          "size": 1,
          "_id": 0,
          "lasttime": 1,
          "price": 1,
          "images": 1,
          "category_info": 1,
          "availability": 1
        }
      }
    )

    MongoAggregate(data).then((res) => {
      setLoading(false);
      if (res.status === "ok") {
        setData(res.result)
      } else {
        setData([])
        show_toast('error', res.error)
      }
    })
  }


  return (
    <>
      <Toast ref={toast}/>
      <CRow>
        <CCol>
          <CCard className="mb-4">
            <CCardHeader>商品详情查询
              <CRow className="float-end">
                {
                  loading ?
                    <CCol>
                      <CSpinner component="span" size="sm" aria-hidden="true"/>
                    </CCol> :
                    <CCol>
                      <div className="icon-hover">
                        <CIcon
                          className="text-success"
                          onClick={(e) => query(1)}
                          icon={cilMediaPlay}/>
                      </div>
                    </CCol>
                }
              </CRow>
            </CCardHeader>
            <CCardBody>
              <MyTreeSelect onNodeSelect={handleSelect}></MyTreeSelect>
              <CInputGroup className="mb-2 mt-1">
                <CInputGroupText className="me-1">价格范围:</CInputGroupText>
                <InputNumber inputId="currency-us" value={p1} onValueChange={(e) => setP1(e.value)} mode="currency"
                             currency="USD" locale="en-US"/>
                <CInputGroupText className="me-1">-</CInputGroupText>
                <InputNumber inputId="currency-us" value={p2} onValueChange={(e) => setP2(e.value)} mode="currency"
                             currency="USD" locale="en-US"/>
              </CInputGroup>

              <CInputGroup className="mb-2 mt-1">
                <CInputGroupText className="me-1">主排名范围:</CInputGroupText>
                <InputNumber value={r1} onValueChange={(e) => setR1(e.value)}/>
                <CInputGroupText className="me-1">-</CInputGroupText>
                <InputNumber value={r2} onValueChange={(e) => setR2(e.value)}/>
              </CInputGroup>

              <CInputGroup className="mb-2 mt-1">
                <CInputGroupText className="me-1">子排名范围:</CInputGroupText>
                <InputNumber value={r3} onValueChange={(e) => setR3(e.value)}/>
                <CInputGroupText className="me-1">-</CInputGroupText>
                <InputNumber value={r4} onValueChange={(e) => setR4(e.value)}/>
              </CInputGroup>

              <CInputGroup className="mb-2 mt-1">
                <CInputGroupText className="me-1">其他卖家数≥:</CInputGroupText>
                <InputNumber value={othersellercount} onValueChange={(e) => setOthersellercount(e.value)}/>
              </CInputGroup>

              <CInputGroup className="mb-2 mt-1">
                <CInputGroupText className="me-1">配送方式:</CInputGroupText>
                <SelectButton value={modelValue} onChange={(e) => setmodelValue(e.value)} options={model}
                              optionLabel="name" multiple/>
              </CInputGroup>

              <CInputGroup className="mb-2 mt-1">
                <CInputGroupText className="me-1">排序:</CInputGroupText>
                <MultiSelect value={selectedCities} onChange={(e) => onCityChange(e)} options={cities}
                             optionLabel="name" display="chip"
                             placeholder="按优先级选" className="w-full md:w-20rem"
                             style={{width: "900px"}}/>
              </CInputGroup>

              <CInputGroup className="mb-2 mt-1">
                <CInputGroupText className="me-1">开始:</CInputGroupText>
                <Calendar value={datetime24hStart} onChange={(e) => setDatetime24hStart(e.value)} showTime
                          hourFormat="24"/>
                <CInputGroupText className="me-1">结束:</CInputGroupText>
                <Calendar value={datetime24hEnd} onChange={(e) => setDatetime24hEnd(e.value)} showTime hourFormat="24"/>
                <CButton onClick={() => {
                  setDatetime24hStart(null)
                  setDatetime24hEnd(null)
                }
                }>清空</CButton>
              </CInputGroup>


              <CInputGroup className="mb-2 mt-1">
                <CFormSwitch size="xl" checked={needMatchBrand} onChange={
                  (e) => {
                    setNeedMatchBrand(e.target.checked)
                  }
                } label="排除已注册的品牌"/>

                <CFormSwitch size="xl" className="ms-2" checked={needsellerNameContainsBrand} onChange={
                  (e) => {
                    setNeedsellerNameContainsBrand(e.target.checked)
                  }
                } label="排除可能不允许跟卖"/>
              </CInputGroup>
              <hr className="mt-0"/>

              <CRow className="align-items-center">
                <CCol>
                  <CButton color="warning" className="position-relative me-2" disabled={downloadLoading}
                           onClick={() => {
                             downloadFile()
                           }}>
                    {
                      downloadLoading && <CSpinner component="span" size="sm" aria-hidden="true"/>
                    }
                    下载数据
                    <CBadge color="danger" position="top-end" shape="rounded-pill">
                      {count}
                    </CBadge>
                  </CButton>
                </CCol>
                <CCol>
                  <Paginator first={first} rows={pageLimit} totalRecords={count}
                             rowsPerPageOptions={[10, 20, 30, 50, 100]} onPageChange={onPageChange}/>
                </CCol>
              </CRow>

              <CTable small align="middle">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col" style={{width: "50px"}}>#</CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="text-center"
                                      style={{width: "610px"}}>简要</CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="text-center">品牌</CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="text-center">价格</CTableHeaderCell>
                    <CTableHeaderCell scope="col"
                                      style={{width: "350px"}}>类目排行</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>

                  {
                    loading ? (
                      <CRow xs={12}>
                        <CCol xs={12} className="d-flex align-items-center justify-content-center">
                          <CSpinner component="span" size="lg" aria-hidden="true"/>
                        </CCol>
                      </CRow>

                    ) : (
                      data.map((item, index) => {
                          return (
                            <CTableRow key={index}>
                              <CTableDataCell scope="row">
                                <span className="small text-secondary"> {index + 1}</span>
                              </CTableDataCell>
                              <CTableDataCell scope="row">
                                <CContainer>
                                  <CRow className="align-items-center">
                                    <CCol xs={3} className="text-center">
                                      {
                                        item.images && item.images.length > 0 ? (
                                          <Avatar className="p-overlay-badge" image={item.images[0]} size="xlarge"
                                                  preview>
                                            <Badge ize="normal" value={item.mode} severity="danger"/>
                                          </Avatar>

                                        ) : (
                                          <Avatar className="p-overlay-badge" size="xlarge">
                                            <Badge size="normal" value={item.mode} severity="danger"/>
                                          </Avatar>
                                        )
                                      }
                                      <div style={{"font-size": "12px"}}>{item.asin}</div>
                                      {item.lasttime &&
                                        <div style={{"font-size": "12px"}}>{formatTimestamp(item.lasttime)}</div>}

                                    </CCol>
                                    <CCol xs={9}>
                                      <CCol>
                                        <CTooltip content={item.title}>
                                          <div className="text-truncate" style={{width: "450px"}}>
                                            <a href={"https://www.amazon.ca/dp/" + item.asin + "?th=1&psc=1"}
                                               target="_blank" rel="noopener noreferrer">{item.title}</a>
                                          </div>
                                        </CTooltip>
                                      </CCol>
                                      <CCol className="text-warning small">
                                        <span>评分:</span>
                                        <strong>{item.productvalues.rating}</strong>
                                        <span className="ms-3">评级数:</span>
                                        <strong>{item.productvalues.ratingscount}</strong>
                                      </CCol>
                                      <CCol className="text-danger small">
                                        <span>主排名:</span>
                                        <strong>{item.productvalues.mainranking}</strong>
                                        <span className="ms-3">子排名:</span>
                                        <strong>{item.productvalues.subranking}</strong>
                                      </CCol>
                                      <CCol className="text-success small">
                                        <span>其他卖家数:</span>
                                        <strong>{item.productvalues.othersellercount}</strong>
                                        <span className="ms-3">评论数:</span>
                                        <strong>{item.productvalues.reviewcount}</strong>
                                      </CCol>
                                      <CCol className="text-secondary small">
                                        <span>库存:</span>
                                        <strong>{item.availability}</strong>
                                      </CCol>
                                      {
                                        item.size && item.size.length > 0 && (
                                          <CCol className="text-info small">
                                            <span>规格:</span>
                                            <strong>{item.size}</strong>
                                          </CCol>
                                        )
                                      }
                                      {
                                        item.listingdate && item.listingdate.length > 0 && (
                                          <CCol className="small">
                                            <span>上架时间:</span>
                                            <strong>{item.listingdate}</strong>
                                          </CCol>
                                        )
                                      }

                                    </CCol>
                                  </CRow>
                                </CContainer>


                              </CTableDataCell>
                              <CTableDataCell scope="row" className="text-center">
                                <CRow>
                                  <CCol xs={12}>
                                  <span className="pt-1 pe-2 p-overlay-badge">
                                    <code>
                                      {item.brand}
                                    </code>
                                    {item.brandInfo && item.brandInfo.length > 0 && (
                                      <Badge severity={item.brandInfo[0].data.empty ? 'success' : "danger"}
                                             value={item.brandInfo[0].data.numFound}></Badge>
                                    )}
                                  </span>
                                  </CCol>
                                  <CCol xs={12}>
                                    <small className="text-success">{item.sellerName}</small>
                                  </CCol>

                                </CRow>
                              </CTableDataCell>
                              <CTableDataCell scope="row" className="text-center">
                                <span className="small text-danger">{item.price}</span>
                              </CTableDataCell>
                              <CTableDataCell scope="row">
                                {
                                  item.category_info.map((item, index) => {
                                    return (
                                      <CTooltip key={index} content={item.path}>
                                        <div className="mb-1">
                                          <span
                                            className="small text-info">#{item.rank} {getLastSegment(item.path)}</span>
                                        </div>
                                      </CTooltip>
                                    )
                                  })
                                }
                              </CTableDataCell>
                            </CTableRow>
                          )
                        }
                      )
                    )

                  }
                </CTableBody>
              </CTable>

            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  );
}

function getLastSegment(str) {
  const segments = str.split(" > ");
  return segments.pop();
}

export default Home;

