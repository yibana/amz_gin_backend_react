import React from 'react';
import CheckboxTree from 'react-checkbox-tree';
import PropTypes from "prop-types";
import "react-checkbox-tree/lib/react-checkbox-tree.css";
import { Input, Dropdown } from "semantic-ui-react";
import {cloneDeep, debounce} from "lodash";
import {build} from "src/components/categoryNode.js"
import {CButton, CContainer, CFormInput, CFormSelect} from "@coreui/react";
import '@fortawesome/fontawesome-free/css/all.min.css';
import {RedisGet, RedisSet} from "../api";

function mergeAndFilterDuplicates(arr1, arr2) {
  const mergedArr = [...arr1, ...arr2];
  const uniqueSet = new Set(mergedArr);
  return [...uniqueSet];
}


class CategoryTree extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      nodes: build(),
      checked: [],
      expanded: [],
      isDropdownExpanded: false,
      keyword: "",
      loading: true
    };
    this.onSearchInputChange = debounce(this.onSearchInputChange.bind(this), 500);
    this.RedisSetSync = debounce(this.RedisSetSync.bind(this), 2000);

  }
  componentDidMount() {
    // 发送API请求
    RedisGet("CategoryTree:checked").then((res) => {
      if (res && res.value && res.value.length > 0) {
        this.setState({checked: JSON.parse(res.value)});
        this.setState({loading: false});
      }
    });
  }
  RedisSetSync = () => RedisSet("CategoryTree:checked", JSON.stringify(this.state.checked));
  onCheck = checked => {
    if(this.state.keyword.length > 0) {
      checked = mergeAndFilterDuplicates(checked, this.state.checked)
    }
    this.setState({ checked }, () => {
      //console.log(this.state.checked);
      this.RedisSetSync();
    });
  };

  onExpand = expanded => {
    if(this.state.keyword.length > 0) {
      expanded = mergeAndFilterDuplicates(expanded, this.state.expanded)
    }

    this.setState({ expanded }, () => {
      //console.log(this.state.expanded);
    });
  };

  renderTree = () => {
    this.setState(
      prevState => {
        return {
          ...prevState,
          isDropdownExpanded: !prevState.isDropdownExpanded
        };
      },
      () => {
        console.log(this.state);
      }
    );
  };

  onSearchInputChange = (event, data, searchedNodes) => {
    this.setState(prevState => {
      if (prevState.keyword.trim() && !data.value.trim()) {
        return {
          expanded: [],
          keyword: data.value
        };
      }
      return {
        expanded: this.getAllValuesFromNodes(searchedNodes, true),
        keyword: data.value
      };
    });
  };

  getAllValuesFromNodes = (nodes, firstLevel) => {
    if (firstLevel) {
      const values = [];
      for (let n of nodes) {
        values.push(n.value);
        if (n.children) {
          values.push(...this.getAllValuesFromNodes(n.children, false));
        }
      }
      return values;
    } else {
      const values = [];
      for (let n of nodes) {
        values.push(n.value);
        if (n.children) {
          values.push(...this.getAllValuesFromNodes(n.children, false));
        }
      }
      return values;
    }
  };

  keywordFilter = (nodes, keyword) => {
    let newNodes = [];
    for (let n of nodes) {
      if (n.children) {
        const nextNodes = this.keywordFilter(n.children, keyword);
        if (nextNodes.length > 0) {
          n.children = nextNodes;
        } else if (n.label.toLowerCase().includes(keyword.toLowerCase())) {
          n.children = nextNodes.length > 0 ? nextNodes : [];
        }
        if (
          nextNodes.length > 0 ||
          n.label.toLowerCase().includes(keyword.toLowerCase())
        ) {
          n.label = this.getHighlightText(n.label, keyword);
          newNodes.push(n);
        }
      } else {
        if (n.label.toLowerCase().includes(keyword.toLowerCase())) {
          n.label = this.getHighlightText(n.label, keyword);
          newNodes.push(n);
        }
      }
    }
    return newNodes;
  };

  getHighlightText = (text, keyword) => {
    const startIndex = text.indexOf(keyword);
    return startIndex !== -1 ? (
      <span>
        {text.substring(0, startIndex)}
        <span style={{ color: "red" }}>
          {text.substring(startIndex, startIndex + keyword.length)}
        </span>
        {text.substring(startIndex + keyword.length)}
      </span>
    ) : (
      <span>{text}</span>
    );
  };

  render() {
    const { checked, expanded, nodes, isDropdownExpanded } = this.state;
    let searchedNodes = this.state.keyword.trim()
      ? this.keywordFilter(cloneDeep(nodes), this.state.keyword)
      : nodes;
    return (
      <div>
        <CContainer>
          <CFormInput
            className="mb-1"
            placeholder="Search"
            onChange={(event) => {
              this.onSearchInputChange(event, event.target, searchedNodes);
            }}
          />
        </CContainer>
        <CContainer>
          <CButton
            className="me-2"
            color="primary"
            variant="outline"
            size="sm"
            onClick={() => {
              this.setState({checked: []});
              this.RedisSetSync();
            }}
          >
            取消选中
          </CButton>

          选中分类总数:[<strong>{this.state.checked.length}</strong>]
        </CContainer>
        <CContainer>
          {this.state.loading ? (
            <div>loading...</div>
          ) : (
            <CheckboxTree
              nodes={searchedNodes}
              checked={checked}
              expanded={expanded}
              onCheck={this.onCheck}
              onExpand={this.onExpand}
              showNodeIcon={true}
            />
          )}
        </CContainer>

      </div>
    );
  }
}
export default CategoryTree;
