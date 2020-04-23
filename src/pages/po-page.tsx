import * as React from "react";
import {withRouter, RouteComponentProps} from "react-router-dom";
import {ISessionDb} from "../api/interfaces";
import {ApiService} from "../api";
import {Button, Segment, Form, Icon} from "semantic-ui-react";
import {toast, ToastContainer} from "react-toastify";

import "./po-page.scss";
import Estimations from "../components/estimations/estimations";

interface IEstimationForm {
  estimation_name: string;
  estimation_description: string;
}

export interface IPoPageProps extends RouteComponentProps {}

export interface IPoPageState {
  session?: PouchDB.Core.Document<ISessionDb> & PouchDB.Core.GetMeta;
  estimationForm?: Partial<IEstimationForm>;
}

class PoPage extends React.Component<IPoPageProps, IPoPageState> {
  readonly api: ApiService = ApiService.Instance;
  sessionId: string | null;

  constructor(props: IPoPageProps) {
    super(props);

    const params = new URLSearchParams(this.props.location.search);
    this.sessionId = params.get("id");
    this.state = {};
  }

  componentDidMount() {
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
    event: React.ChangeEvent<HTMLInputElement>
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
        <Segment.Group>
          <Segment secondary clearing className="session-header">
            Session name: {this.state.session?.session_name}
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
          <Segment>
            <Form
              onSubmit={(event) => {
                this.onEstimationFormSubmit(this.state.estimationForm);
              }}
            >
              <Form.Field>
                <input
                  name="estimation_name"
                  placeholder="Estimation Name"
                  onChange={this.onEstimationFormInputChange}
                  value={this.state.estimationForm?.estimation_name}
                />
              </Form.Field>
              <Form.Field>
                <input
                  name="estimation_description"
                  placeholder="Estimation Description"
                  onChange={this.onEstimationFormInputChange}
                  value={this.state.estimationForm?.estimation_description}
                />
              </Form.Field>
              <Button floated="right" type="submit">
                New
              </Button>
            </Form>
          </Segment>
        </Segment.Group>
        <Segment.Group className="estimation-container">
          <Segment textAlign="center">{estimationsComponent}</Segment>
        </Segment.Group>
        <ToastContainer autoClose={3000} />
      </div>
    );
  }
}

export default withRouter(PoPage);
