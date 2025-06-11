import React from 'react';
import { Admin, Resource } from 'react-admin';
import dataProvider from './dataProvider';
import {
  ArtikelList, ArtikelEdit, ArtikelCreate,
  ChatList, ChatEdit, ChatCreate,
  QuizList, QuizEdit, QuizCreate,
  FavoriteList, FavoriteEdit,
  SummaryList, SummaryEdit, SummaryCreate
} from './resources';
import {
  Article,
  Chat,
  Quiz,
  Favorite,
  Summarize
} from '@mui/icons-material';

const App = () => (
  <Admin dataProvider={dataProvider}>
    <Resource
      name="artikels"
      list={ArtikelList}
      edit={ArtikelEdit}
      create={ArtikelCreate}
      icon={Article}
    />
    <Resource
      name="chats"
      list={ChatList}
      edit={ChatEdit}
      create={ChatCreate}
      icon={Chat}
    />
    <Resource
      name="quizzes"
      list={QuizList}
      edit={QuizEdit}
      create={QuizCreate}
      icon={Quiz}
    />
    <Resource
      name="favorites"
      list={FavoriteList}
      edit={FavoriteEdit}
      icon={Favorite}
    />
    <Resource
      name="summaries"
      list={SummaryList}
      edit={SummaryEdit}
      create={SummaryCreate}
      icon={Summarize}
    />
  </Admin>
);

export default App;
