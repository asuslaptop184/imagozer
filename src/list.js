const { Component, render, findDOMNode, Fragment } = wp.element;

import Loader from 'react-loader-spinner'
import axios from 'axios';
import ReactTable from "react-table";
import logo from '../assets/proeditor.png';

import DropdownTreeSelect from 'react-dropdown-tree-select'

import {
  IMAGE_EDITOR_list_to_tree as list_to_tree,
  IMAGE_EDITOR_isset as isset
} from "./utils.js";

const {
  Button,
  FormFileUpload
} = wp.components;

const {
  MediaUpload
} = wp.editor;


const alias = 'ImageEditor-List-'
class IMAGE_EDITOR_List extends Component {

  constructor(props) {
    super(props);

    this.start_breadcrumbs = {
      0: {
        'ID': 0,
        'folder_name': 'All'
      }
    };

    this.state = {
      paged: 1,
      totals: 0,
      new_folder_block: false,
      current_folder_id: 0,
      folders_list: {},
      loading: {
        show: true,
        msg: 'loading images ...'
      },
      data: [],
      breadcrumbs: this.start_breadcrumbs
    }

    this.per_page = 10;
    this.addNewFolder = this.addNewFolder.bind(this);
    this.fetchFolders( 0 );
  }

  fetchData( state )
  {
    const self = this;

    this.setState({
      loading: {
        show: true,
        msg: 'loading images list ...'
      }
    });

    axios.post( NIM.ajax_url, {
      sub_action: 'get_media',
      paged: state.page,
      per_page: this.per_page,
      folderID: this.state.current_folder_id
    })
    .then(res => {

      const { status, msg, data } = res.data

      if( status == 'no-items' ){
        self.setState({
          data: [],
          totals: 0,
          loading: {
            show: false
          }
        });

        return true;
      }

      var result = Object.keys(data.rows).map(function(key) {
        return data.rows[key];
      });

      self.setState({ data: result, totals: data.totals });

      this.setState({
        loading: {
          show: false
        }
      });
    })

    this.folderIDRef = React.createRef();
  }

  deleteFolder( folderID )
  {
    if( confirm("Are you sure you want to delete this folder?") ){
      this.setState({
        loading: {
          show: true,
          msg: `deleting folder ID: ${ folderID }`
        }
      });

      axios.post( NIM.ajax_url, {
        sub_action: 'delete_folder',
        folderID: folderID
      })
      .then(res => {
        const { status, msg, data } = res.data

        NIM.folders = data.new_folders_list;

        this.fetchFolders( 0 );

        this.setState({
          loading: {
            show: false
          },
          breadcrumbs: this.start_breadcrumbs
        });
      })
    }
  }

  fetchFolders( parentID )
  {
    const self = this;

    this.setState({
      loading: {
        show: true,
        msg: 'loading folders ...'
      }
    });

    axios.post( NIM.ajax_url, {
      sub_action: 'get_folders',
      parentID: parentID
    })
    .then(res => {
      const { status, msg, data } = res.data

      this.setState({
        folders_list: data.folders_list,
        loading: {
          show: false
        },
        current_folder_id: parentID
      });

      this.fetchData( this.state );
    })
  }

  addNewFolder( e )
  {
    e.preventDefault();

    const { folder_name, folder_id } = e.target.elements;

    if( folder_name.value == "" ){
      alert("Please set folder name!");
      return true;
    }

    axios.post( NIM.ajax_url, {
      sub_action: 'save_new_folder',
      folder_name: folder_name.value,
      parent_folder_id: folder_id.value
    })
    .then(res => {

      const { status, msg, data } = res.data
      if( status == 'valid' ){

        NIM.folders = data.new_folders_list;

        this.fetchFolders( folder_id.value );

        this.setState({ new_folder_block: false })
      }
    })
  }

  removeFolderLink( postID )
  {
    this.setState({
      loading: {
        show: true,
        msg: 'remove image from folder ...'
      }
    });

    axios.post( NIM.ajax_url, {
      sub_action: 'remove_folder_link',
      postID: postID
    })
    .then(res => {
      this.fetchData( this.state );
    })
  }

  saveFolderLink( folderID, postID )
  {

    this.setState({
      loading: {
        show: true,
        msg: 'Link image to folder ...'
      }
    });

    axios.post( NIM.ajax_url, {
      sub_action: 'save_folder_link',
      folderID: folderID,
      postID: postID
    })
    .then(res => {
      this.fetchData( this.state );
    })
  }

  showLoading()
  {
    const { loading } = this.state

    if( loading.show ){
      return <div className={ `${alias}overlay-loading` }>
        <div>
          <Loader
            type="Puff"
            color="#00BFFF"
            height="100"
            width="100"
          />
          <h2>{ loading.msg }</h2>
        </div>
      </div>
    }
  }

  newFolderBlock()
  {
    const { current_folder_id } = this.state;

    return <div className={ `${alias}add-new-folder-wrapper` }>
      <div className={ `${alias}add-new-folder-content` }>
        <h1>Add New Folder</h1>

        <span class="dashicons dashicons-no" onClick={ e => { e.preventDefault(); this.setState({ new_folder_block: false }) }}></span>

        <form onSubmit={ this.addNewFolder }>
          <input type="text" name="folder_name" placeholder="New Folder Name" />
          <input type="hidden" name="folder_id" ref={ this.folderIDRef } value={ current_folder_id } />

          <h2>Add to another folder</h2>
          <DropdownTreeSelect onChange={ (currentNode, selectedNodes) => {
            this.folderIDRef.current.value = selectedNodes[0].ID;
          } } data={ list_to_tree( NIM.folders, {}, current_folder_id ) } radioSelect={ true } />

          <input type="submit" value="Save" />
        </form>
      </div>
    </div>
  }

  buildFolderList()
  {
    const { folders_list, breadcrumbs, current_folder_id } = this.state;

    return <div className={ `${alias}folders` }>
      <ul className={ `${alias}breadcrumbs` }>
        {
          Object.keys(breadcrumbs).map( ( key, index ) => {
            return <li>
              <a href="#" onClick={ e => {
                e.preventDefault();
                this.fetchFolders( breadcrumbs[key].ID );

                let new_breadcrumbs = {};
                Object.keys(breadcrumbs).map( (key2, index2) => {
                  if( index2 <= index ){
                    new_breadcrumbs[key2] = breadcrumbs[key2];
                  }
                })
                this.setState({ breadcrumbs: new_breadcrumbs });
              }}>
                { breadcrumbs[key].folder_name }
              </a>

              {
                breadcrumbs[key].ID ? <a onClick={ e => { 
                  e.preventDefault();
                  this.deleteFolder( breadcrumbs[key].ID );
                } } href="#delete-folder" title="delete folder" className={ `${alias}folder-delete` }><i class="dashicons dashicons-no-alt"></i></a> : <Fragment></Fragment>
              }

              <span>/</span>

            </li>
          })
        }
      </ul>
      <ul className={ `${alias}folders-list` }>
        {
          Object.keys(folders_list).length ? Object.keys(folders_list).map( key => {
            return <li onClick={ e=> {
              this.fetchFolders( folders_list[key].ID );

              this.setState({ breadcrumbs: { ...breadcrumbs, [folders_list[key].ID]: folders_list[key] } });
            }}>
              <div className={ `${alias}folder-is_close` }>
                <div className={ `${alias}folder-name` }>
                  <span>{ folders_list[key].folder_name }</span>
                  <span>{ folders_list[key].count } images and { folders_list[key].folders_count } folders</span>
                </div>
              </div>
            </li>
          }) : ''
        }
        {
          Object.keys(folders_list).length == 0 ?
          <div className={ `${alias}folder-no-more` }>No subfolders available </div> : ''
        }
      </ul>

      <a href="#add-folder" onClick={ (e) => {
        e.preventDefault();
        this.setState({ new_folder_block: true })
      }} className={ `${alias}folder-add` }><i className="react-categories-icon-folder_add"></i><span>New Folder</span></a>
    </div>
  }

  render()
  {
    const { data, totals, new_folder_block, breadcrumbs } = this.state;

    return <div className={ `${alias}wrapper` }>
      <div className={ `${alias}nav` }>
        <a href={ NIM.plugin_url } className={ `${alias}logo` }>
          <img src={ logo } />
          <div>
            <span>Pro Image Editor</span>
            <span>Folders File Manager</span>
          </div>
        </a>

        { this.buildFolderList() }
      </div>

      <div className={ `${alias}content` }>
        { this.showLoading() }

        { new_folder_block ? this.newFolderBlock() : '' }

        <h1>
          Images Media Library <span>Total items: <span>({totals})</span></span>

          <a href={ NIM.add_new_url } className={ `${alias}add-new-btn` }>Add New Image</a>
        </h1>

        <ReactTable
          columns={[
            {
              Header: "Thumb",
              width: 90,
              Cell: ( props ) => {
                return <a href={ props.original.edit_url } className={ `${alias}thumbnail` }>
                  <img src={ props.original.thumbnail } />
                </a>
              }
            },
            {
              Header: <div
                style={{
                  textAlign: "left"
                }}
              >File</div>,
              accessor: 'post_title',
              Cell: ( props ) => {
                return <div className={ `${alias}title` }>
                  <div>
                    <a href={ props.original.edit_url }>{ props.original.post_title }</a>
                    <span>&nbsp;({ props.original.filename })</span>
                  </div>

                  <a href={ props.original.edit_url } className={ `${alias}edit-btn` }>edit image</a>
                </div>
              }
            },
            {
              Header: "Folder",
              width: 200,
              Cell: ( props ) => {
                return <div className={ `${alias}folder` }>
                  <DropdownTreeSelect onChange={ (currentNode, selectedNodes) => {

                    if( !isset( selectedNodes, 0 ) ){
                      this.removeFolderLink( props.original.ID );
                    }else{
                      this.saveFolderLink( selectedNodes[0].ID, props.original.ID );
                    }
                  } } data={ list_to_tree( NIM.folders, {}, props.original.folder_ID  ) } radioSelect={ true } />
                </div>
              }
            },
            {
              Header: "Status",
              width: 200,
              Cell: ( props ) => {

                if( props.original.status ){

                  return <div className={ `${alias}status` }>
                    { Object.keys(props.original.status).map( (elm) => {
                      return <p>{ elm }: <strong>{ props.original.status[elm] }</strong></p>
                    })}
                  </div>
                }

                return <div className={ `${alias}status-never-edit` }>This photo has not been edited</div>
              }
            },
            {
              Header: "Image Sizes",
              width: 290,
              Cell: ( props ) => {

                return <ul className={ `${alias}sizes` }>
                {
                  Object.keys(props.original.sizes).map( (item) => {
                    return <li><a target="_blank" href={ props.original.sizes[item][0] }>{ item }</a></li>
                  })
                }
                </ul>
              }
            },
            {
              Header: "Author",
              width: 100,
              Cell: ( props ) => {
                return <a href={ `${props.original.author_url}` } className={ `${alias}author` }>{ props.original.author }</a>
              }
            },
            {
              Header: "Date",
              accessor: 'post_date',
              width: 200,
              Cell: ( props ) => {
                return <span className={ `${alias}data` }>{ props.original.post_date }</span>
              }
            }
          ]}
          manual // Forces table not to paginate or sort automatically, so we can handle it server-side
          data={ data }
          pages={ Math.ceil( totals / this.per_page ) } // Display the total number of pages
          onFetchData={this.fetchData.bind(this)} // Request new data when things change
          className="-striped -highlight"
          pageSize={ this.per_page }
          showPageSizeOptions={ false }
          sortable={ false }
          onPageChange={ (page) => {
            this.setState({ paged: page });
          }}
        />
      </div>
    </div>
  }
}

export { IMAGE_EDITOR_List };
