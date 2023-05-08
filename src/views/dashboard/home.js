import {useEffect, useState} from "react";
import React from 'react'
import {
  CAvatar,
  CCard,
  CCardBody,
  CCardHeader,
  CCol, CContainer,
  CForm,
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
import {ConvertToTreeSelect, MongoAggregate} from "../../api";
import {InputNumber} from 'primereact/inputnumber';
import {SelectButton} from 'primereact/selectbutton';
import CIcon from "@coreui/icons-react";
import {cilHistory, cilMediaPlay, cilMediaStop} from "@coreui/icons";
import "src/css/ProductDetail.css";
import {Avatar} from 'primereact/avatar';
import {Badge} from "primereact/badge";
import {MultiSelect} from 'primereact/multiselect';

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

function Home() {
  const [path, setPath] = useState("");
  const [p1, setP1] = useState(0);
  const [p2, setP2] = useState(1000);
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

  const [modelValue, setmodelValue] = useState([]);
  const [pageLimit, setPageLimit] = useState(10);
  const [data, setData] = useState([]);
  const query = (page) => {
    setLoading(true);
    setPage(page)
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
          "$skip": pageLimit * (page - 1)
        },
        {
          "$limit": pageLimit
        }
      ]
    };
    if (modelValue.length > 0) {
      data.pipeline[0].$match["deliveryinfo.mode"] = {
        "$in": modelValue
      }
    }
    if (selectedCities.length>0) {
      let sort = {};
      selectedCities.forEach((item) => {
        sort = {...sort, ...item.code}
      })
      data.pipeline.push({
        "$sort": sort
      })
    }
    MongoAggregate(data).then((res) => {
      setLoading(false);
      if (res.status === "ok") {
        setData(res.result)
      } else {
        setData([])
      }
    })
  }


  return (
    <>
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
              <CInputGroup className="mb-3 mt-1">
                <CInputGroupText className="me-1" id="basic-addon1">价格范围:</CInputGroupText>
                <InputNumber inputId="currency-us" value={p1} onValueChange={(e) => setP1(e.value)} mode="currency"
                             currency="USD" locale="en-US"/>
                <CInputGroupText className="me-1">-</CInputGroupText>
                <InputNumber inputId="currency-us" value={p2} onValueChange={(e) => setP2(e.value)} mode="currency"
                             currency="USD" locale="en-US"/>
              </CInputGroup>

              <CInputGroup className="mb-3 mt-1">
                <CInputGroupText className="me-1" id="basic-addon1">配送方式:</CInputGroupText>
                <SelectButton value={modelValue} onChange={(e) => setmodelValue(e.value)} options={model}
                              optionLabel="name" multiple/>
              </CInputGroup>

              <CInputGroup className="mb-3 mt-1">
                <CInputGroupText className="me-1" id="basic-addon1">每页显示:</CInputGroupText>
                <SelectButton value={pageLimit} onChange={(e) => setPageLimit(e.value)} options={pageLimitOptions}
                              optionLabel="label"/>
              </CInputGroup>

              <CInputGroup className="mb-3 mt-1">
                <CInputGroupText className="me-1" id="basic-addon1">排序:</CInputGroupText>
                <MultiSelect value={selectedCities} onChange={(e) => onCityChange(e)} options={cities}
                             optionLabel="name" display="chip"
                             placeholder="按优先级选" className="w-full md:w-20rem"
                             style={{width: "900px"}}/>
              </CInputGroup>
              <CPagination align="end" className="cursor-pointer">
                <CPaginationItem onClick={
                  (e) => {
                    query(1)
                  }
                }>首页</CPaginationItem>
                <CPaginationItem disabled={page==1} onClick={
                  (e) => {
                    query(page - 1)
                  }
                }>上页</CPaginationItem>
                <CPaginationItem onClick={
                  (e) => {
                    query(page )
                  }
                }>{page}</CPaginationItem>
                <CPaginationItem onClick={
                  (e) => {
                    query(page + 1)
                  }
                }>下一页</CPaginationItem>
              </CPagination>
              <CTable small align="middle">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col" style={{width: "50px"}}>#</CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="text-center"
                                      style={{width: "610px"}}>简要</CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="text-center">Asin</CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="text-center">品牌</CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="text-center">价格</CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="text-center"
                                      style={{width: "350px"}}>类目排行</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {
                    data.map((item, index) => {
                        return (
                          <CTableRow key={index}>
                            <CTableDataCell scope="row">
                              <span className="small text-secondary"> {index + 1}</span>
                            </CTableDataCell>
                            <CTableDataCell scope="row">
                              <CContainer>
                                <CRow className="align-items-center">
                                  <CCol xs={2}>
                                    {
                                      item.images && item.images.length > 0 ? (
                                        <Avatar className="p-overlay-badge" image={item.images[0]} size="xlarge">
                                          <Badge ize="normal" value={item.deliveryinfo.mode} severity="danger"/>
                                        </Avatar>
                                      ) : (
                                        <Avatar className="p-overlay-badge" size="xlarge">
                                          <Badge size="normal" value={item.deliveryinfo.mode} severity="danger"/>
                                        </Avatar>
                                      )
                                    }
                                  </CCol>
                                  <CCol xs={10}>
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
                                      item.listingdate && item.listingdate.length>0 &&  (
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
                            <CTableDataCell scope="row" className="text-center">{item.asin}</CTableDataCell>
                            <CTableDataCell scope="row" className="text-center">{item.brand}</CTableDataCell>
                            <CTableDataCell scope="row" className="text-center">{item.price}</CTableDataCell>
                            <CTableDataCell scope="row">
                              {
                                item.category_info.map((item, index) => {
                                  return (
                                  <CTooltip key={index} content={item.path}>
                                    <div className="mb-1">
                                      <span className="small text-info">#{item.rank} {getLastSegment(item.path)}</span>
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

