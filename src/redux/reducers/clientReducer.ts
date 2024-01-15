// userReducer.ts
interface ClientState {
  clients: { name: string } | null;
}

const initialState: ClientState = {
  clients: null,
};

type ClientAction = { type: "SET_CLIENTS"; payload: { name: string } };

const clientReducer = (
  state = initialState,
  action: ClientAction
): ClientState => {
  switch (action.type) {
    case "SET_CLIENTS":
      return {
        ...state,
        clients: action.payload,
      };
    default:
      return state;
  }
};

export default clientReducer;
