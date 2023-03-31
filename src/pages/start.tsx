import * as React from "react";
import {
  Button,
  Form,
  Segment,
  Grid,
  Divider,
  List,
  Header,
} from "semantic-ui-react";

import { ApiService } from "../api";
import "./start.scss";
import {
  LocalSessionApi,
  ISessionAccess,
} from "../services/local-session-storage";
import { WithRoutes, timeFormat, withRouter } from "../utils";

export interface IStartProps extends WithRoutes {}

export interface IStartState {
  form: IForm;
  valid?: IForm;
  previousSessions: ISessionAccess[] | null;
}

interface IForm {
  session_name: string;
  session_pin: string;
  [key: string]: string;
}

enum FormField {
  session_name = "session_name",
  session_pin = "session_pin",
}

class Start extends React.Component<IStartProps, IStartState> {
  api: ApiService = ApiService.Instance;

  state: IStartState = {
    form: {
      session_name: "",
      session_pin: "",
    },

    previousSessions: LocalSessionApi.getSessions(),
  };

  componentDidMount() {
    this.api.info().then((data) => {
      console.log("info", data);
    });
  }

  onFormSubmit = (formData: IForm) => {
    if (formData.session_name !== "") {
      const newSession = {
        ...formData,
        ...{ created_at: new Date().getTime() },
      };
      this.api.post(newSession).then((response) => {
        if (response.ok) {
          LocalSessionApi.saveSession({
            _id: response.id,
            session_name: formData.session_name,
            session_pin: formData.session_pin,
            created_at: newSession.created_at,
          });
          this.props.router.navigate(`/po?id=${response.id}`, {
            replace: true,
          });
        }
      });
    }
  };

  onInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const form = {
      ...this.state.form,
      ...{ [event.currentTarget.name]: event.currentTarget.value },
    };

    this.setState({ form });
  };

  onPreviousSessionDelete = (event: React.MouseEvent, sessionId: string) => {
    event.stopPropagation();
    this.api.delete(sessionId).finally(() => {
      LocalSessionApi.deleteSession(sessionId);
      this.setState({ previousSessions: LocalSessionApi.getSessions() });
    });
  };

  onSessionLinkClick = (sessionId: string) => {
    this.props.router.navigate(`/po?id=${sessionId}`, { replace: true });
  };

  public render() {
    return (
      <div id="start-page">
        <Segment raised>
          <Grid columns={2} stackable>
            <Grid.Column verticalAlign="middle">
              <Header textAlign="center">New Session</Header>
              <Form
                onSubmit={(e) => {
                  this.onFormSubmit(this.state.form);
                }}
              >
                <Form.Input
                  required
                  fluid
                  icon="clock outline"
                  iconPosition="left"
                  name={FormField.session_name}
                  value={this.state.form.session_name}
                  label="Session Name"
                  placeholder="Session Name"
                  onChange={this.onInputChange}
                  className={this.state.valid?.session_name}
                />
                <Form.Input
                  required={false}
                  fluid
                  icon="lock"
                  disabled
                  iconPosition="left"
                  name={FormField.session_pin}
                  value={this.state.form.session_pin}
                  label="Session PIN"
                  placeholder="Session PIN"
                  onChange={this.onInputChange}
                  className={this.state.valid?.session_pin}
                />
                <Button type="submit" primary>
                  Submit
                </Button>
              </Form>
            </Grid.Column>
            <Grid.Column verticalAlign="top">
              <Header textAlign="center">Recent Sessions</Header>
              <List divided verticalAlign="middle">
                {this.state.previousSessions?.length ? (
                  this.state.previousSessions?.map((session) => {
                    return (
                      <List.Item
                        as="a"
                        key={session._id}
                        onClick={() => {
                          this.onSessionLinkClick(session._id);
                        }}
                      >
                        <List.Content floated="right">
                          <Button
                            icon="times circle outline"
                            onClick={(e) => {
                              this.onPreviousSessionDelete(e, session._id);
                            }}
                          ></Button>
                        </List.Content>
                        <List.Icon
                          name="clock outline"
                          verticalAlign="middle"
                        />
                        <List.Content>
                          <List.Header>{session.session_name}</List.Header>
                          <List.Description>
                            {timeFormat(session.created_at)}
                          </List.Description>
                        </List.Content>
                      </List.Item>
                    );
                  })
                ) : (
                  <List.Item>
                    <List.Content>No previous sessions</List.Content>
                  </List.Item>
                )}
              </List>
            </Grid.Column>
          </Grid>
          <Divider vertical>Or</Divider>
        </Segment>
      </div>
    );
  }
}

export default withRouter(Start);
