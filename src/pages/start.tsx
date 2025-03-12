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

import "./start.scss";
import {
  LocalSessionApi,
} from "../services/local-session-storage";
import { WithRoutes, timeFormat, withRouter } from "../utils";
import { AppPath } from "../App";
import { SessionService } from "../api";
import { Session } from "../api/model";

export interface IStartProps extends WithRoutes {}

export interface IStartState {
  form: IForm;
  valid?: IForm;
  previousSessions: Session[] | null;
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
  // api: ApiService = ApiService.Instance;
  sessionService = new SessionService();

  state: IStartState = {
    form: {
      session_name: "",
      session_pin: "",
    },

    previousSessions: LocalSessionApi.getSessions(),
  };

  componentDidMount() {
    this.sessionService.status().then((status) => {
      console.log("SupaBase - status", status);
    });
  }

  onFormSubmit = (formData: IForm) => {
    if (formData.session_name !== "") {
      const newSession: Partial<Session> = {
        name: formData.session_name,
        pin: formData.session_pin,
      };
      this.sessionService.create(newSession).then((response) => {
        LocalSessionApi.saveSession(response);
        this.props.router.navigate(`${AppPath.Po}?id=${response.id}`);
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
    this.sessionService.delete(sessionId).then(() => {
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
                        key={session.id}
                        onClick={() => {
                          this.onSessionLinkClick(session.id);
                        }}
                      >
                        <List.Content floated="right">
                          <Button
                            icon="times circle outline"
                            onClick={(e) => {
                              // this.onPreviousSessionDelete(e, session._id);
                            }}
                          ></Button>
                        </List.Content>
                        <List.Icon
                          name="clock outline"
                          verticalAlign="middle"
                        />
                        <List.Content>
                          <List.Header>{session.name}</List.Header>
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
