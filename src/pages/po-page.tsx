import * as React from "react";
import {withRouter, RouteComponentProps} from "react-router-dom";
import {Button, Segment, Form, Icon} from "semantic-ui-react";
import {toast, ToastContainer} from "react-toastify";
import Papa from "papaparse";
import {v4 as uuid} from "uuid";

import "./po-page.scss";
import {ISessionDb, IEstimation} from "../api/interfaces";
import {ApiService} from "../api";
import Estimations from "../components/estimations/estimations";
import {ImportZone} from "../components/import-zone/import-zone";

interface IEstimationForm {
  estimation_name: string;
  estimation_description: string;
}

interface RouteParams {
  id: string;
}

export interface IPoPageProps extends RouteComponentProps<RouteParams> {}

export interface IPoPageState {
  session?: PouchDB.Core.Document<ISessionDb> & PouchDB.Core.GetMeta;
  estimationForm?: Partial<IEstimationForm>;
}

class PoPage extends React.Component<IPoPageProps, IPoPageState> {
  readonly api: ApiService = ApiService.Instance;
  sessionId: string | null;

  constructor(props: IPoPageProps) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    this.sessionId = this.props.match.params.id;
    if (this.sessionId) {
      this.getSession();
      this.api.onChange(this.getSession);
    } else {
      // redirect him
    }
  }

  getSession = () => {
    this.api.getSession(this.sessionId!).then((session) => {
      this.setState({session: session});
    });
  };

  onEstimationFormInputChange = (
    event:
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLInputElement>
  ) => {
    const estimationForm = {
      ...this.state.estimationForm,
      ...{[event.currentTarget.name]: event.currentTarget.value},
    };

    this.setState({estimationForm});
  };

  onEstimationFormSubmit = (form?: Partial<IEstimationForm>) => {
    if (form && form.estimation_name) {
      this.api.createNewEstimation(this.state.session!, {
        name: form.estimation_name,
        description: form.estimation_description,
        timestamp: new Date().getTime(),
        isActive: false,
        isEnded: false,
        votes: {},
      });
    }
  };

  onImportFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.importEstimationsFromFile(event.target.files[0]);
  };

  onImportFileAccepted = (acceptedFiles: File[]) => {
    this.importEstimationsFromFile(acceptedFiles[0]);
  };

  importEstimationsFromFile(file: File) {
    Papa.parse(file, {
      complete: (results) => {
        console.log(results);

        if (!results.errors.length) {
          const fields = (results.data[0] as string[]).reduce(
            (acc, current, curentIndex) => {
              if (current === "Issue key") {
                acc.issueKey = curentIndex;
              }

              if (current === "Description") {
                acc.description = curentIndex;
              }

              return acc;
            },
            {issueKey: 0, description: 0}
          );

          const valuesArray = results.data.filter(
            (current, currentIndex, arr) => {
              return currentIndex !== 0 && currentIndex !== arr.length - 1;
            }
          );

          const importedEstimations: {
            [key: string]: IEstimation;
          } = valuesArray.reduce(
            (acc: {[key: string]: Partial<IEstimation>}, current: string[]) => {
              const estimationId = uuid();
              acc[estimationId] = {
                id: estimationId,
                name: current[fields.issueKey],
                description: current[fields.description],
                votes: {},
              };

              return acc;
            },
            {}
          );

          this.api
            .importEstimations(this.sessionId, importedEstimations)
            .then((response) => {});
        } else {
          // error information with toaster;
        }
      },
    });
  }

  onCopyButtonClick = () => {
    const devSessionUrl = `${window.location.origin}/dev?id=${this.sessionId}`;
    navigator.clipboard.writeText(devSessionUrl);
    toast.success("Dev url Copied!", {
      position: toast.POSITION.BOTTOM_RIGHT,
    });
  };

  public render() {
    const hasEstimations: boolean =
      this.state.session?.estimations &&
      !!Object.keys(this.state.session?.estimations).length;
    const estimationsComponent = hasEstimations ? (
      <Estimations
        rev={this.state.session._rev}
        id={this.state.session._id}
        estimations={this.state.session?.estimations}
      ></Estimations>
    ) : (
      <h4> No Estimations</h4>
    );

    return (
      <div id="po-page">
        <div className="wrapper">
          <Segment.Group>
            <Segment secondary clearing className="session-header">
              Session: {this.state.session?.session_name}
              <Button
                onClick={this.onCopyButtonClick}
                color="blue"
                size="mini"
                floated="right"
                inverted
              >
                <Icon name="share alternate" />
                Copy Invitation Link
              </Button>
            </Segment>
            <Segment.Group className="estimation-form-group" horizontal>
              <Segment>
                <Form
                  onSubmit={(event) => {
                    this.onEstimationFormSubmit(this.state.estimationForm);
                  }}
                >
                  <Form.Field>
                    <input
                      name="estimation_name"
                      placeholder="Story Name"
                      onChange={this.onEstimationFormInputChange}
                      value={this.state.estimationForm?.estimation_name}
                    />
                  </Form.Field>
                  <Form.Field>
                    <textarea
                      rows={2}
                      name="estimation_description"
                      placeholder="Story Description"
                      onChange={this.onEstimationFormInputChange}
                      value={this.state.estimationForm?.estimation_description}
                    ></textarea>
                  </Form.Field>
                  <Button floated="left" type="submit" color="green">
                    <Icon name="angle double down" />
                    Add Story
                  </Button>
                </Form>
              </Segment>
              <Segment className="estimation-form-group__upload">
                <ImportZone
                  onFileUploaded={this.onImportFileAccepted}
                ></ImportZone>
              </Segment>
            </Segment.Group>
          </Segment.Group>
          <Segment.Group className="estimation-container">
            <Segment textAlign="center">{estimationsComponent}</Segment>
          </Segment.Group>
          <ToastContainer autoClose={3000} />
        </div>
      </div>
    );
  }
}

export default withRouter(PoPage);
